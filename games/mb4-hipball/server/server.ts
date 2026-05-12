// ============================================================
//  MB4 — HIPBALL — PartyKit server (input relay)
//
//  Pattern: room-id-as-roomCode. PartyKit routes /party/<id> to one
//  Durable Object per id. We accept up to 2 clients per room:
//    - first connection  = host (player 1)
//    - second connection = guest (player 2)
//  Both are told "matchStart" once both arrive.
//  Then we just relay {t:'input',...} messages to the OTHER connection.
//
//  Drift policy: clients run an identical deterministic sim and stay
//  in step from matched starting state. No server-side physics in v1.
// ============================================================

import type * as Party from "partykit/server";

type Role = "host" | "guest";

interface ClientMeta {
  role: Role;
}

export default class HipballServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Track role per connection id
  private metas = new Map<string, ClientMeta>();

  onConnect(conn: Party.Connection) {
    // Count existing connections (excluding this new one which is already in
    // room.getConnections()).
    const others = [...this.room.getConnections()].filter(c => c.id !== conn.id);
    if (others.length >= 2) {
      conn.send(JSON.stringify({ t: "error", reason: "Room full." }));
      conn.close();
      return;
    }
    const role: Role = others.length === 0 ? "host" : "guest";
    this.metas.set(conn.id, { role });
    conn.send(JSON.stringify({ t: "welcome", role }));

    // If now both connected, broadcast matchStart
    if (others.length === 1) {
      const seed = Date.now() & 0xffffff;
      for (const c of this.room.getConnections()) {
        c.send(JSON.stringify({ t: "matchStart", seed }));
      }
    } else {
      // Notify the lone host that someone is waiting
      for (const c of others) {
        c.send(JSON.stringify({ t: "peerJoined" }));
      }
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: any = null;
    try { msg = JSON.parse(message); } catch { return; }
    if (!msg || typeof msg !== "object" || !msg.t) return;

    // Heartbeat
    if (msg.t === "ping") {
      sender.send(JSON.stringify({ t: "pong" }));
      return;
    }
    if (msg.t === "hello") {
      // client just announcing its preferred role; we already assigned one
      return;
    }
    // Relay input frames to the OTHER connection
    if (msg.t === "input") {
      for (const c of this.room.getConnections()) {
        if (c.id !== sender.id) {
          c.send(message);   // forward as-is (saves re-stringifying)
        }
      }
      return;
    }
  }

  onClose(conn: Party.Connection) {
    this.metas.delete(conn.id);
    for (const c of this.room.getConnections()) {
      if (c.id !== conn.id) {
        c.send(JSON.stringify({ t: "peerLeft" }));
      }
    }
  }
}

HipballServer satisfies Party.Worker;
