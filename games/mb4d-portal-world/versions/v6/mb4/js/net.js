// ============================================================
//  NETWORK — thin PartyKit client using raw WebSocket.
//  PartyKit URL shape: wss://<host>/party/<roomId>
//  We exchange JSON messages. Server is authoritative for ball + scoring.
// ============================================================
'use strict';

(function () {
  const ROOM_LETTERS = 'OLMECYU';   // Mesoamerican-flavored room codes (no ambiguous chars)

  function genRoomCode(len) {
    let s = '';
    for (let i = 0; i < (len || 4); i++) s += ROOM_LETTERS[Math.floor(Math.random() * ROOM_LETTERS.length)];
    return s;
  }

  function normalizeRoomCode(raw) {
    return (raw || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
  }

  class Net4 {
    constructor() {
      this.ws = null;
      this.connected = false;
      this.role = null;        // 'host' (player 1) | 'guest' (player 2)
      this.roomCode = null;
      this.host = null;        // PartyKit host
      this.handlers = {};      // type -> fn(msg)
      this._reconnectAttempts = 0;
      this._heartbeat = null;
    }

    on(type, fn) { this.handlers[type] = fn; return this; }
    _emit(type, msg) { if (this.handlers[type]) this.handlers[type](msg); }

    isAvailable() {
      return !!(MB4.MP.PARTYKIT_HOST && MB4.MP.PARTYKIT_HOST.length);
    }

    connect(roomCode, role) {
      if (!this.isAvailable()) {
        this._emit('error', { reason: 'Multiplayer is not configured. See README.' });
        return;
      }
      this.roomCode = normalizeRoomCode(roomCode);
      this.host = MB4.MP.PARTYKIT_HOST;
      this.role = role;
      const proto = (this.host.startsWith('localhost') || this.host.startsWith('127.')) ? 'ws' : 'wss';
      const url = `${proto}://${this.host}/party/${this.roomCode}`;
      try {
        this.ws = new WebSocket(url);
      } catch (e) {
        this._emit('error', { reason: 'WebSocket failed: ' + e.message });
        return;
      }
      this.ws.onopen = () => {
        this.connected = true;
        this._reconnectAttempts = 0;
        this.send({ t: 'hello', role: this.role });
        this._heartbeat = setInterval(() => this.send({ t: 'ping' }), 15000);
        this._emit('open', {});
      };
      this.ws.onmessage = (ev) => {
        let msg = null;
        try { msg = JSON.parse(ev.data); } catch (e) { return; }
        if (!msg || !msg.t) return;
        this._emit(msg.t, msg);
      };
      this.ws.onclose = () => {
        this.connected = false;
        if (this._heartbeat) { clearInterval(this._heartbeat); this._heartbeat = null; }
        this._emit('close', {});
      };
      this.ws.onerror = () => {
        this._emit('error', { reason: 'Network error' });
      };
    }

    send(msg) {
      if (!this.ws || this.ws.readyState !== 1) return false;
      this.ws.send(JSON.stringify(msg));
      return true;
    }

    sendInput(inp) {
      // Send a compact input frame. Edge-trigger pressed bools.
      this.send({
        t: 'input',
        l: inp.left, r: inp.right, f: inp.fwd, b: inp.back,
        j: inp.jumpPressed,
        h: inp.hipPressed, k: inp.kneePressed, e: inp.elbowPressed,
      });
    }

    close() {
      if (this._heartbeat) { clearInterval(this._heartbeat); this._heartbeat = null; }
      if (this.ws) {
        try { this.ws.close(); } catch (_) {}
        this.ws = null;
      }
      this.connected = false;
    }
  }

  window.Net4 = new Net4();
  window.Net4.genRoomCode = genRoomCode;
  window.Net4.normalizeRoomCode = normalizeRoomCode;
})();
