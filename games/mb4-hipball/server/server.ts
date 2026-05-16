// ============================================================
//  MB4 — HIPBALL — PartyKit server
//
//  Handles two unrelated systems via one Party.Server class:
//
//  1. MULTIPLAYER INPUT RELAY (WebSocket) — room-id-as-roomCode.
//     Up to 2 clients per room. First = host, second = guest.
//     Both told "matchStart" once both arrive. Server relays
//     {t:'input',...} messages to the OTHER connection.
//
//  2. COMMENTS (HTTP, single shared room) — anonymous comment box
//     for the arcade landing page. Comments are stored in room
//     storage keyed by `comment:<id>`. The "main" room is the
//     canonical place — clients hit /parties/main/main/comments.
//     Endpoints:
//       GET    /comments       → list newest 50
//       POST   /comments       → add a comment (rate-limited, filtered)
//       DELETE /comments?id=X  → admin-only via Bearer ADMIN_TOKEN
//
//  Drift policy for MP: clients run an identical deterministic sim
//  and stay in step from matched starting state. No server-side
//  physics in v1.
// ============================================================
import type * as Party from "partykit/server";

type Role = "host" | "guest";
interface ClientMeta {
  role: Role;
}

// ---- Comment helpers ----

interface Comment {
  id: string;
  name: string;
  text: string;
  timestamp: number;
}

// Very basic profanity filter. Matches whole-word + leetspeak variants.
// This is defense in depth; the client has its own filter too. Add more
// words here if you find gaps.
const BAD_WORDS = [
  "fuck", "shit", "bitch", "asshole", "dick", "pussy", "cunt", "fag",
  "nigger", "nigga", "retard", "tranny", "kike", "spic", "chink",
  "whore", "slut", "cock", "twat", "wank",
];
function containsProfanity(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/[0o]/g, "o")
    .replace(/[1i!|]/g, "i")
    .replace(/[3e]/g, "e")
    .replace(/[4a@]/g, "a")
    .replace(/[5s$]/g, "s")
    .replace(/[7t]/g, "t")
    .replace(/[^a-z]/g, "");
  return BAD_WORDS.some(w => normalized.includes(w));
}

// Rate limit: per-IP, sliding window of 60s, max 5 comments.
const rateLog = new Map<string, number[]>();
function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const arr = (rateLog.get(ip) || []).filter(t => t > windowStart);
  if (arr.length >= 5) {
    rateLog.set(ip, arr);
    return false;
  }
  arr.push(now);
  rateLog.set(ip, arr);
  return true;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

// ---- Server class ----

export default class HipballServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  private metas = new Map<string, ClientMeta>();

  // ---- HTTP (comments) ----

  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/^.*\/comments/, "/comments");

    if (path === "/comments" || path.startsWith("/comments")) {
      if (req.method === "GET") return this.listComments();
      if (req.method === "POST") return this.addComment(req);
      if (req.method === "DELETE") return this.deleteComment(req, url);
    }

    return jsonResponse({ error: "Not found" }, 404);
  }

  async listComments(): Promise<Response> {
    const all = await this.room.storage.list({ prefix: "comment:" });
    const comments: Comment[] = [];
    for (const [, v] of all) {
      comments.push(v as Comment);
    }
    comments.sort((a, b) => b.timestamp - a.timestamp);
    return jsonResponse({ comments: comments.slice(0, 50) });
  }

  async addComment(req: Party.Request): Promise<Response> {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    let name = typeof body?.name === "string" ? body.name.trim() : "";
    let text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) return jsonResponse({ error: "Empty comment" }, 400);
    if (text.length > 280) return jsonResponse({ error: "Comment too long (max 280)" }, 400);
    if (name.length > 32) name = name.slice(0, 32);
    if (!name) name = "Anonymous";

    name = name.replace(/[\x00-\x1f\x7f]/g, "");
    text = text.replace(/[\x00-\x1f\x7f]/g, "");

    if (containsProfanity(name) || containsProfanity(text)) {
      return jsonResponse({ error: "Comment was flagged. Try different words." }, 400);
    }

    const ip = req.headers.get("CF-Connecting-IP")
            || req.headers.get("X-Forwarded-For")
            || "unknown";
    if (!rateLimitOk(ip)) {
      return jsonResponse({ error: "Too many comments. Slow down a bit." }, 429);
    }

    const comment: Comment = {
      id: crypto.randomUUID(),
      name, text,
      timestamp: Date.now(),
    };
    await this.room.storage.put(`comment:${comment.id}`, comment);
    return jsonResponse({ ok: true, comment });
  }

  async deleteComment(req: Party.Request, url: URL): Promise<Response> {
    const auth = req.headers.get("Authorization") || "";
    const want = (this.room.env.ADMIN_TOKEN as string) || "";
    if (!want || !auth.startsWith("Bearer ") || auth.slice(7) !== want) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const id = url.searchParams.get("id");
    if (!id) return jsonResponse({ error: "Missing id" }, 400);
    await this.room.storage.delete(`comment:${id}`);
    return jsonResponse({ ok: true });
  }

  // ---- WebSocket (multiplayer relay, unchanged) ----

  onConnect(conn: Party.Connection) {
    const others = [...this.room.getConnections()].filter(c => c.id !== conn.id);
    if (others.length >= 2) {
      conn.send(JSON.stringify({ t: "error", reason: "Room full." }));
      conn.close();
      return;
    }
    const role: Role = others.length === 0 ? "host" : "guest";
    this.metas.set(conn.id, { role });
    conn.send(JSON.stringify({ t: "welcome", role }));
    if (others.length === 1) {
      const seed = Date.now() & 0xffffff;
      for (const c of this.room.getConnections()) {
        c.send(JSON.stringify({ t: "matchStart", seed }));
      }
    } else {
      for (const c of others) {
        c.send(JSON.stringify({ t: "peerJoined" }));
      }
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: any = null;
    try { msg = JSON.parse(message); } catch { return; }
    if (!msg || typeof msg !== "object" || !msg.t) return;
    if (msg.t === "ping") {
      sender.send(JSON.stringify({ t: "pong" }));
      return;
    }
    if (msg.t === "hello") return;
    if (msg.t === "input") {
      for (const c of this.room.getConnections()) {
        if (c.id !== sender.id) c.send(message);
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
