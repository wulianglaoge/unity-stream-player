import { defineComponent as ct, computed as I, ref as O, onMounted as dt, watch as Te, nextTick as lt, onBeforeUnmount as ut, openBlock as R, createElementBlock as L, withModifiers as Ve, normalizeStyle as ht, createElementVNode as _, toDisplayString as re, createCommentVNode as ce } from "vue";
class ft extends EventTarget {
  constructor(e = 1e3) {
    super(), this.interval = e, this.sleep = (t) => new Promise((s) => setTimeout(s, t));
    let n;
    location.protocol === "https:" ? n = "wss://" + location.host : n = "ws://" + location.host, this.websocket = new WebSocket(n), this.connectionId = null, this.websocket.onopen = () => {
      this.isWsOpen = !0;
    }, this.websocket.onclose = () => {
      this.isWsOpen = !1;
    }, this.websocket.onmessage = (t) => {
      const s = JSON.parse(t.data);
      if (!(!s || !this))
        switch (s.type) {
          case "connect":
            this.dispatchEvent(new CustomEvent("connect", { detail: s }));
            break;
          case "disconnect":
            this.dispatchEvent(new CustomEvent("disconnect", { detail: s }));
            break;
          case "offer":
            this.dispatchEvent(
              new CustomEvent("offer", {
                detail: {
                  connectionId: s.from,
                  sdp: s.data.sdp,
                  polite: s.data.polite
                }
              })
            );
            break;
          case "answer":
            this.dispatchEvent(
              new CustomEvent("answer", {
                detail: { connectionId: s.from, sdp: s.data.sdp }
              })
            );
            break;
          case "candidate":
            this.dispatchEvent(
              new CustomEvent("candidate", {
                detail: {
                  connectionId: s.from,
                  candidate: s.data.candidate,
                  sdpMLineIndex: s.data.sdpMLineIndex,
                  sdpMid: s.data.sdpMid
                }
              })
            );
            break;
        }
    };
  }
  async start() {
    for (; !this.isWsOpen; )
      await this.sleep(100);
  }
  async stop() {
    for (this.websocket.close(); this.isWsOpen; )
      await this.sleep(100);
  }
  createConnection(e) {
    const n = JSON.stringify({ type: "connect", connectionId: e });
    this.websocket.send(n);
  }
  deleteConnection(e) {
    const n = JSON.stringify({ type: "disconnect", connectionId: e });
    this.websocket.send(n);
  }
  sendOffer(e, n) {
    const s = JSON.stringify({
      type: "offer",
      from: e,
      data: { sdp: n, connectionId: e }
    });
    this.websocket.send(s);
  }
  sendAnswer(e, n) {
    const s = JSON.stringify({
      type: "answer",
      from: e,
      data: { sdp: n, connectionId: e }
    });
    this.websocket.send(s);
  }
  sendCandidate(e, n, t, s) {
    const r = JSON.stringify({
      type: "candidate",
      from: e,
      data: {
        candidate: n,
        sdpMLineIndex: t,
        sdpMid: s,
        connectionId: e
      }
    });
    this.websocket.send(r);
  }
}
class pt extends EventTarget {
  constructor(e, n, t, s = 5e3) {
    super();
    const c = this;
    this.connectionId = e, this.polite = n, this.config = t, this.pc = new RTCPeerConnection(this.config), this.makingOffer = !1, this.waitingAnswer = !1, this.ignoreOffer = !1, this.srdAnswerPending = !1, this.log = (r) => void (c.polite, `${r}`, void 0), this.warn = (r) => void (c.polite, `${r}`, void 0), this.assert_equals = window.assert_equals ? window.assert_equals : (r, f, D) => {
      if (r !== f)
        throw new Error(`${D} expected ${f} but got ${r}`);
    }, this.interval = s, this.sleep = (r) => new Promise((f) => setTimeout(f, r)), this.pc.ontrack = (r) => {
      c.log(`ontrack:${r}`), c.dispatchEvent(new CustomEvent("trackevent", { detail: r }));
    }, this.pc.ondatachannel = (r) => {
      c.log(`ondatachannel:${r}`), c.dispatchEvent(new CustomEvent("adddatachannel", { detail: r }));
    }, this.pc.onicecandidate = ({ candidate: r }) => {
      c.log(`send candidate:${r}`), r != null && c.dispatchEvent(
        new CustomEvent("sendcandidate", {
          detail: {
            connectionId: c.connectionId,
            candidate: r.candidate,
            sdpMLineIndex: r.sdpMLineIndex,
            sdpMid: r.sdpMid
          }
        })
      );
    }, this.pc.onnegotiationneeded = this._onNegotiation.bind(this), this.pc.onsignalingstatechange = () => {
      c.log(`signalingState changed:${c.pc.signalingState}`);
    }, this.pc.oniceconnectionstatechange = () => {
      c.log(`iceConnectionState changed:${c.pc.iceConnectionState}`), c.pc.iceConnectionState === "disconnected" && this.dispatchEvent(new Event("disconnect"));
    }, this.pc.onicegatheringstatechange = () => {
      c.log(`iceGatheringState changed:${c.pc.iceGatheringState}'`);
    }, this.loopResendOffer();
  }
  async _onNegotiation() {
    try {
      this.log("SLD due to negotiationneeded"), this.assert_equals(
        this.pc.signalingState,
        "stable",
        "negotiationneeded always fires in stable state"
      ), this.assert_equals(
        this.makingOffer,
        !1,
        "negotiationneeded not already in progress"
      ), this.makingOffer = !0, await this.pc.setLocalDescription(), this.assert_equals(
        this.pc.signalingState,
        "have-local-offer",
        "negotiationneeded not racing with onmessage"
      ), this.assert_equals(
        this.pc.localDescription.type,
        "offer",
        "negotiationneeded SLD worked"
      ), this.waitingAnswer = !0, this.dispatchEvent(
        new CustomEvent("sendoffer", {
          detail: {
            connectionId: this.connectionId,
            sdp: this.pc.localDescription.sdp
          }
        })
      );
    } catch (e) {
      this.log(e);
    } finally {
      this.makingOffer = !1;
    }
  }
  async loopResendOffer() {
    for (; this.connectionId; )
      this.pc && this.waitingAnswer && this.dispatchEvent(
        new CustomEvent("sendoffer", {
          detail: {
            connectionId: this.connectionId,
            sdp: this.pc.localDescription.sdp
          }
        })
      ), await this.sleep(this.interval);
  }
  close() {
    this.connectionId = null, this.pc && (this.pc.close(), this.pc = null);
  }
  getTransceivers(e) {
    return this.connectionId != e ? null : this.pc.getTransceivers();
  }
  addTrack(e, n) {
    return this.connectionId != e ? null : this.pc.addTrack(n);
  }
  addTransceiver(e, n, t) {
    return this.connectionId != e ? null : this.pc.addTransceiver(n, t);
  }
  createDataChannel(e, n) {
    return this.connectionId != e ? null : this.pc.createDataChannel(n);
  }
  async getStats(e) {
    return this.connectionId != e ? null : await this.pc.getStats();
  }
  async onGotDescription(e, n) {
    if (this.connectionId != e)
      return;
    const t = this, s = this.pc.signalingState == "stable" || this.pc.signalingState == "have-local-offer" && this.srdAnswerPending;
    if (this.ignoreOffer = n.type == "offer" && !this.polite && (this.makingOffer || !s), this.ignoreOffer) {
      t.log("glare - ignoring offer");
      return;
    }
    this.waitingAnswer = !1, this.srdAnswerPending = n.type == "answer", t.log(`SRD(${n.type})`), await this.pc.setRemoteDescription(n), this.srdAnswerPending = !1, n.type == "offer" ? (t.dispatchEvent(
      new CustomEvent("ongotoffer", {
        detail: { connectionId: t.connectionId }
      })
    ), t.assert_equals(
      this.pc.signalingState,
      "have-remote-offer",
      "Remote offer"
    ), t.assert_equals(
      this.pc.remoteDescription.type,
      "offer",
      "SRD worked"
    ), t.log("SLD to get back to stable"), await this.pc.setLocalDescription(), t.assert_equals(
      this.pc.signalingState,
      "stable",
      "onmessage not racing with negotiationneeded"
    ), t.assert_equals(
      this.pc.localDescription.type,
      "answer",
      "onmessage SLD worked"
    ), t.dispatchEvent(
      new CustomEvent("sendanswer", {
        detail: {
          connectionId: t.connectionId,
          sdp: t.pc.localDescription.sdp
        }
      })
    )) : (t.dispatchEvent(
      new CustomEvent("ongotanswer", {
        detail: { connectionId: t.connectionId }
      })
    ), t.assert_equals(
      this.pc.remoteDescription.type,
      "answer",
      "Answer was set"
    ), t.assert_equals(this.pc.signalingState, "stable", "answered"), this.pc.dispatchEvent(new Event("negotiated")));
  }
  async onGotCandidate(e, n) {
    if (this.connectionId == e)
      try {
        await this.pc.addIceCandidate(n);
      } catch {
        this.pc && !this.ignoreOffer && this.warn(
          `${this.pc} this candidate can't accept current signaling state ${this.pc.signalingState}.`
        );
      }
  }
}
function gt() {
  const l = URL.createObjectURL(new Blob()), e = l.toString();
  return URL.revokeObjectURL(l), e.split(/[:/]/g).pop().toLowerCase();
}
class vt {
  constructor(e, n) {
    this._peer = null, this._connectionId = null, this.onConnect = function(t) {
    }, this.onDisconnect = function(t) {
    }, this.onGotOffer = function(t) {
    }, this.onGotAnswer = function(t) {
    }, this.onTrackEvent = function(t) {
    }, this.onAddChannel = function(t) {
    }, this._config = n, this._signaling = e, this._signaling.addEventListener("connect", this._onConnect.bind(this)), this._signaling.addEventListener("disconnect", this._onDisconnect.bind(this)), this._signaling.addEventListener("offer", this._onOffer.bind(this)), this._signaling.addEventListener("answer", this._onAnswer.bind(this)), this._signaling.addEventListener("candidate", this._onIceCandidate.bind(this));
  }
  async _onConnect(e) {
    const n = e.detail;
    this._connectionId == n.connectionId && (this._preparePeerConnection(this._connectionId, n.polite), this.onConnect(n.connectionId));
  }
  async _onDisconnect(e) {
    const n = e.detail;
    this._connectionId == n.connectionId && (this.onDisconnect(n.connectionId), this._peer && (this._peer.close(), this._peer = null));
  }
  async _onOffer(e) {
    const n = e.detail;
    this._peer || this._preparePeerConnection(n.connectionId, n.polite);
    const t = new RTCSessionDescription({ sdp: n.sdp, type: "offer" });
    try {
      await this._peer.onGotDescription(n.connectionId, t);
    } catch (s) {
      `${s}${t.type}${t.sdp}`;
      return;
    }
  }
  async _onAnswer(e) {
    const n = e.detail, t = new RTCSessionDescription({ sdp: n.sdp, type: "answer" });
    if (this._peer)
      try {
        await this._peer.onGotDescription(n.connectionId, t);
      } catch (s) {
        `${s}${t.type}${t.sdp}`;
        return;
      }
  }
  async _onIceCandidate(e) {
    const n = e.detail, t = new RTCIceCandidate({
      candidate: n.candidate,
      sdpMid: n.sdpMid,
      sdpMLineIndex: n.sdpMLineIndex
    });
    this._peer && await this._peer.onGotCandidate(n.connectionId, t);
  }
  async createConnection(e) {
    this._connectionId = e || gt(), await this._signaling.createConnection(this._connectionId);
  }
  async deleteConnection() {
    await this._signaling.deleteConnection(this._connectionId);
  }
  _preparePeerConnection(e, n) {
    return this._peer && (this._peer.close(), this._peer = null), this._peer = new pt(e, n, this._config), this._peer.addEventListener("disconnect", () => {
      this.onDisconnect(
        `Receive disconnect message from peer. connectionId:${e}`
      );
    }), this._peer.addEventListener("trackevent", (t) => {
      const s = t.detail;
      this.onTrackEvent(s);
    }), this._peer.addEventListener("adddatachannel", (t) => {
      const s = t.detail;
      this.onAddChannel(s);
    }), this._peer.addEventListener("ongotoffer", (t) => {
      const s = t.detail.connectionId;
      this.onGotOffer(s);
    }), this._peer.addEventListener("ongotanswer", (t) => {
      const s = t.detail.connectionId;
      this.onGotAnswer(s);
    }), this._peer.addEventListener("sendoffer", (t) => {
      const s = t.detail;
      this._signaling.sendOffer(s.connectionId, s.sdp);
    }), this._peer.addEventListener("sendanswer", (t) => {
      const s = t.detail;
      this._signaling.sendAnswer(s.connectionId, s.sdp);
    }), this._peer.addEventListener("sendcandidate", (t) => {
      const s = t.detail;
      this._signaling.sendCandidate(
        s.connectionId,
        s.candidate,
        s.sdpMid,
        s.sdpMLineIndex
      );
    }), this._peer;
  }
  async getStats() {
    return await this._peer.getStats(this._connectionId);
  }
  createDataChannel(e) {
    return this._peer.createDataChannel(this._connectionId, e);
  }
  addTrack(e) {
    return this._peer.addTrack(this._connectionId, e);
  }
  addTransceiver(e, n) {
    return this._peer.addTransceiver(this._connectionId, e, n);
  }
  getTransceivers() {
    return this._peer.getTransceivers(this._connectionId);
  }
  async start() {
    await this._signaling.start();
  }
  async stop() {
    this._peer && (this._peer.close(), this._peer = null), this._signaling && (await this._signaling.stop(), this._signaling = null);
  }
}
class u {
  static get sizeOfInt() {
    return 4;
  }
  static writeSingleBit(e, n, t) {
    const s = n >> 3, c = 1 << (n & 7), r = new Uint8Array(e);
    t ? r[s] |= c : r[s] &= ~c;
  }
}
const wt = {}, mt = new Proxy(
  {},
  {
    get: (l, e) => {
      const n = String(e);
      let t = 0;
      for (let s = 0; s < n.length; s++)
        t = t * 31 + n.charCodeAt(s) >>> 0;
      return t % 110;
    }
  }
), Q = {
  Left: 0,
  Right: 1,
  Middle: 2,
  Back: 3,
  Forward: 4
}, w = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LeftShoulder: 4,
  RightShoulder: 5,
  LeftTrigger: 6,
  RightTrigger: 7,
  Select: 8,
  Start: 9,
  LeftStick: 10,
  RightStick: 11,
  DpadUp: 12,
  DpadDown: 13,
  DpadLeft: 14,
  DpadRight: 15
}, C = {
  Began: 0,
  Moved: 1,
  Stationary: 2,
  Ended: 3,
  Canceled: 4
}, _t = {
  Tap: 1
};
class P {
  constructor(e, n, t, s) {
    this._code = e.charCodeAt() << 24 | n.charCodeAt() << 16 | t.charCodeAt() << 8 | s.charCodeAt();
  }
  toInt32() {
    return this._code;
  }
}
class fe {
  constructor(e, n, t, s, c) {
    this.name = e, this.layout = n, this.deviceId = t, this.usages = s, this.description = c, this._inputState = null;
  }
  updateState(e) {
    this._inputState = e;
  }
  queueEvent(e) {
    throw new Error("Please implement this method.");
  }
  get currentState() {
    return this._inputState;
  }
}
class yt extends fe {
  queueEvent(e) {
    this.updateState(new de(e));
  }
}
class Je extends fe {
  static get keycount() {
    return 110;
  }
  queueEvent(e) {
    this.updateState(new Z(e, this.currentState));
  }
}
class bt extends fe {
  queueEvent(e, n) {
    this.updateState(new le(e, this.currentState, n));
  }
}
class It extends fe {
  queueEvent(e) {
    this.updateState(new ue(e));
  }
}
class y {
  static get invalidEventId() {
    return 0;
  }
  static get size() {
    return 20;
  }
  constructor(e, n, t, s) {
    this.type = e, this.sizeInBytes = n, this.deviceId = t, this.time = s, this.eventId = y.invalidEventId;
  }
  get buffer() {
    const e = new ArrayBuffer(y.size), n = new DataView(e);
    return n.setInt32(0, this.type, !0), n.setInt16(4, this.sizeInBytes, !0), n.setInt16(6, this.deviceId, !0), n.setFloat64(8, this.time, !0), n.setInt16(16, this.sizeInBytes, !0), e;
  }
}
class pe {
  get buffer() {
    throw new Error("Please implement this field");
  }
  get format() {
    throw new Error("Please implement this field");
  }
}
class de extends pe {
  static get size() {
    return 30;
  }
  static get format() {
    return new P("M", "O", "U", "S").toInt32();
  }
  constructor(e) {
    super(), this.position = [e.clientX, e.clientY], this.delta = [e.movementX, -e.movementY], this.scroll = [0, 0], e.type === "wheel" && (this.scroll = [e.deltaX, e.deltaY]), this.buttons = new ArrayBuffer(2);
    const n = e.buttons & 1, t = e.buttons & 2, s = e.buttons & 4, c = e.buttons & 8, r = e.buttons & 16;
    u.writeSingleBit(this.buttons, Q.Left, n), u.writeSingleBit(this.buttons, Q.Right, t), u.writeSingleBit(this.buttons, Q.Middle, s), u.writeSingleBit(this.buttons, Q.Forward, r), u.writeSingleBit(this.buttons, Q.Back, c);
  }
  get buffer() {
    const e = de.size, n = new Uint16Array(this.buttons)[0], t = new ArrayBuffer(e), s = new DataView(t);
    return s.setFloat32(0, this.position[0], !0), s.setFloat32(4, this.position[1], !0), s.setFloat32(8, this.delta[0], !0), s.setFloat32(12, this.delta[1], !0), s.setFloat32(16, this.scroll[0], !0), s.setFloat32(20, this.scroll[1], !0), s.setUint16(24, n, !0), s.setUint16(26, this.displayIndex || 0, !0), s.setUint16(28, this.clickCount || 0, !0), t;
  }
  get format() {
    return de.format;
  }
}
class Z extends pe {
  static get sizeInBits() {
    return Je.keycount;
  }
  static get sizeInBytes() {
    return Z.sizeInBits + 7 >> 3;
  }
  static get format() {
    return new P("K", "E", "Y", "S").toInt32();
  }
  constructor(e, n) {
    super(), !n || !n.keys ? this.keys = new ArrayBuffer(Z.sizeInBytes) : this.keys = n.keys;
    let t = !1;
    switch (e.type) {
      case "keydown":
        t = !0;
        break;
      case "keyup":
        t = !1;
        break;
      default:
        throw new Error(`unknown event type ${e.type})`);
    }
    const s = mt[e.code];
    u.writeSingleBit(this.keys, s, t);
  }
  get buffer() {
    return this.keys;
  }
  get format() {
    return Z.format;
  }
}
class g {
  static get format() {
    return new P("T", "O", "U", "C").toInt32();
  }
  static get size() {
    return 56;
  }
  static incrementTouchId() {
    return g._currentTouchId === void 0 && (g._currentTouchId = 0), ++g._currentTouchId;
  }
  static prevTouches() {
    return g._prevTouches === void 0 && (g._prevTouches = new Array(10)), g._prevTouches;
  }
  constructor(e, n, t, s, c, r, f) {
    this.touchId = e, this.position = t != null ? t.slice() : null, r == C.Moved ? this.delta = [
      this.position[0] - n.position[0],
      this.position[1] - n.position[1]
    ] : this.delta = [0, 0], this.pressure = s, this.radius = c != null ? c.slice() : null, this.phaseId = r, this.tapCount = 0, this.displayIndex = 0, this.flags = 0, this.padding = 0, r == C.Began ? (this.startTime = f, this.startPosition = this.position.slice()) : (this.startTime = n != null ? n.startTime : null, this.startPosition = n != null ? n.startPosition.slice() : null);
  }
  copy() {
    const e = new g();
    return e.touchId = this.touchId, e.position = this.position.slice(), e.delta = this.delta.slice(), e.pressure = this.pressure, e.radius = this.radius.slice(), e.phaseId = this.phaseId, e.tapCount = this.tapCount, e.displayIndex = this.displayIndex, e.flags = this.flags, e.padding = this.padding, e.startTime = this.startTime, e.startPosition = this.startPosition.slice(), e;
  }
  get buffer() {
    const e = g.size, n = new ArrayBuffer(e), t = new DataView(n);
    return t.setInt32(0, this.touchId, !0), t.setFloat32(4, this.position[0], !0), t.setFloat32(8, this.position[1], !0), t.setFloat32(12, this.delta[0], !0), t.setFloat32(16, this.delta[1], !0), t.setFloat32(20, this.pressure, !0), t.setFloat32(24, this.radius[0], !0), t.setFloat32(28, this.radius[1], !0), t.setInt8(32, this.phaseId, !0), t.setInt8(33, this.tapCount, !0), t.setInt8(34, this.displayIndex, !0), t.setInt8(35, this.flags, !0), t.setInt32(36, this.padding, !0), t.setFloat64(40, this.startTime, !0), t.setFloat32(48, this.startPosition[0], !0), t.setFloat32(52, this.startPosition[1], !0), n;
  }
  get format() {
    return g.format;
  }
}
class le extends pe {
  static get maxTouches() {
    return 10;
  }
  static get format() {
    return new P("T", "S", "C", "R").toInt32();
  }
  static convertPhaseId(e) {
    let n = C.Stationary;
    switch (e) {
      case "touchstart":
        n = C.Began;
        break;
      case "touchend":
        n = C.Ended;
        break;
      case "touchmove":
        n = C.Moved;
        break;
      case "touchcancel":
        n = C.Canceled;
        break;
    }
    return n;
  }
  constructor(e, n, t) {
    switch (super(), e.type) {
      case "click": {
        this.touchData = new Array(n.touchData.length);
        for (let s = 0; s < n.touchData.length; s++)
          this.touchData[s] = n.touchData[s], this.touchData[s].phaseId == C.Ended && (this.touchData[s].tapCount = 1, this.touchData[s].flags |= _t.Tap);
        break;
      }
      default: {
        const s = e.changedTouches;
        this.touchData = new Array(s.length);
        for (let c = 0; c < s.length; c++) {
          const r = s[c], f = [r.clientX, r.clientY], D = le.convertPhaseId(e.type), ee = r.force, ge = [r.radiusX, r.radiusY], ve = D == C.Began ? g.incrementTouchId() : g.prevTouches()[r.identifier].touchId, we = D != C.Began ? g.prevTouches()[r.identifier] : null, te = new g(
            ve,
            we,
            f,
            ee,
            ge,
            D,
            t
          );
          g.prevTouches()[r.identifier] = te, this.touchData[c] = te;
        }
        break;
      }
    }
  }
  get buffer() {
    const e = g.size * this.touchData.length, n = new ArrayBuffer(e), t = new Uint8Array(n);
    for (let s = 0; s < this.touchData.length; s++)
      t.set(
        new Uint8Array(this.touchData[s].buffer),
        g.size * s
      );
    return n;
  }
  get format() {
    return le.format;
  }
}
class ue extends pe {
  static get size() {
    return 28;
  }
  static get format() {
    return new P("G", "P", "A", "D").toInt32();
  }
  constructor(e) {
    super();
    const n = e.gamepad, t = e.gamepad.buttons;
    this.buttons = new ArrayBuffer(4), this.leftStick = [n.axes[0], -n.axes[1]], this.rightStick = [n.axes[2], -n.axes[3]], this.leftTrigger = t[6].value, this.rightTrigger = t[7].value, u.writeSingleBit(this.buttons, w.A, t[0].pressed), u.writeSingleBit(this.buttons, w.B, t[1].pressed), u.writeSingleBit(this.buttons, w.X, t[2].pressed), u.writeSingleBit(this.buttons, w.Y, t[3].pressed), u.writeSingleBit(
      this.buttons,
      w.LeftShoulder,
      t[4].pressed
    ), u.writeSingleBit(
      this.buttons,
      w.RightShoulder,
      t[5].pressed
    ), u.writeSingleBit(
      this.buttons,
      w.LeftTrigger,
      t[6].pressed
    ), u.writeSingleBit(
      this.buttons,
      w.RightTrigger,
      t[7].pressed
    ), u.writeSingleBit(
      this.buttons,
      w.Select,
      t[8].pressed
    ), u.writeSingleBit(
      this.buttons,
      w.Start,
      t[9].pressed
    ), u.writeSingleBit(
      this.buttons,
      w.LeftStick,
      t[10].pressed
    ), u.writeSingleBit(
      this.buttons,
      w.RightStick,
      t[11].pressed
    ), u.writeSingleBit(
      this.buttons,
      w.DpadUp,
      t[12].pressed
    ), u.writeSingleBit(
      this.buttons,
      w.DpadDown,
      t[13].pressed
    ), u.writeSingleBit(
      this.buttons,
      w.DpadLeft,
      t[14].pressed
    ), u.writeSingleBit(
      this.buttons,
      w.DpadRight,
      t[15].pressed
    );
  }
  get buffer() {
    const e = ue.size, n = new ArrayBuffer(e), t = new DataView(n);
    return t.setUint32(0, new Uint32Array(this.buttons)[0], !0), t.setFloat32(4, this.leftStick[0], !0), t.setFloat32(8, this.leftStick[1], !0), t.setFloat32(12, this.rightStick[0], !0), t.setFloat32(16, this.rightStick[1], !0), t.setFloat32(20, this.leftTrigger, !0), t.setFloat32(24, this.rightTrigger, !0), n;
  }
  get format() {
    return ue.format;
  }
}
class he {
  static get format() {
    return new P("T", "E", "X", "T").toInt32();
  }
  static create(e, n, t) {
    const s = y.size + u.sizeOfInt, c = new he();
    return c.baseEvent = new y(he.format, s, e, t), c.character = wt[n.key] || 0, c;
  }
  get buffer() {
    const e = y.size + u.sizeOfInt, n = new ArrayBuffer(e), t = new Uint8Array(n), s = new DataView(n);
    return t.set(new Uint8Array(this.baseEvent.buffer), 0), s.setInt32(y.size, this.character, !0), n;
  }
}
class W {
  static get format() {
    return new P("S", "T", "A", "T").toInt32();
  }
  static from(e, n) {
    return W.fromState(e.currentState, e.deviceId, n);
  }
  static fromState(e, n, t) {
    const s = e.buffer, c = s.byteLength, r = y.size + u.sizeOfInt + c, f = new W();
    return f.baseEvent = new y(
      W.format,
      r,
      n,
      t
    ), f.stateFormat = e.format, f.stateData = s, f;
  }
  get buffer() {
    const e = this.stateData.byteLength, n = y.size + u.sizeOfInt + e, t = new ArrayBuffer(n), s = new Uint8Array(t), c = new DataView(t);
    return s.set(new Uint8Array(this.baseEvent.buffer), 0), c.setInt32(y.size, this.stateFormat, !0), s.set(
      new Uint8Array(this.stateData),
      y.size + u.sizeOfInt
    ), t;
  }
}
class Et {
  constructor() {
    this._onevent = new EventTarget();
  }
  get onEvent() {
    return this._onevent;
  }
  get devices() {
    throw new Error("Please implement this method.");
  }
  get startTime() {
    return this._startTime;
  }
  get timeSinceStartup() {
    return Date.now() / 1e3 - this.startTime;
  }
  setStartTime(e) {
    this._startTime = e;
  }
}
const Re = {
  Added: 0,
  Removed: 1,
  UsageChanged: 6
};
class St {
  constructor(e) {
    this._localManager = e, this._subscribers = [], this._sending = !1;
  }
  startSending() {
    if (this._sending) return;
    this._sending = !0;
    const e = (t) => {
      this._sendEvent(t.detail.event);
    }, n = (t) => {
      this._sendDeviceChange(t.detail.device, t.detail.change);
    };
    this._localManager.setStartTime(Date.now() / 1e3), this._localManager.onEvent.addEventListener("event", e), this._localManager.onEvent.addEventListener("changedeviceusage", n), this._sendInitialMessages();
  }
  stopSending() {
    this._sending && (this._sending = !1);
  }
  subscribe(e) {
    this._subscribers.push(e);
  }
  _sendInitialMessages() {
    this._sendAllGeneratedLayouts(), this._sendAllDevices();
  }
  _sendAllGeneratedLayouts() {
  }
  _sendAllDevices() {
    const e = this._localManager.devices;
    if (e)
      for (const n of e)
        this._sendDevice(n);
  }
  _sendDevice(e) {
    const n = We.create(e);
    this._send(n);
  }
  _sendEvent(e) {
    const n = Be.create(e);
    this._send(n);
  }
  _sendDeviceChange(e, n) {
    if (!this._subscribers) return;
    let t = null;
    switch (n) {
      case Re.Added:
        t = We.Create(e);
        break;
      case Re.Removed:
        t = kt.Create(e);
        break;
      case Re.UsageChanged:
        t = Ct.Create(e);
        break;
      default:
        return;
    }
    this._send(t);
  }
  _send(e) {
    for (const n of this._subscribers)
      n.onNext(e);
  }
}
const Le = {
  NewDevice: 3,
  NewEvents: 4,
  RemoveDevice: 5
};
class Me {
  constructor(e, n, t) {
    this.participant_id = e, this.type = n, this.length = t.byteLength, this.data = t;
  }
  get buffer() {
    const e = u.sizeOfInt + u.sizeOfInt + u.sizeOfInt + this.data.byteLength, n = new ArrayBuffer(e), t = new DataView(n), s = new Uint8Array(n);
    return t.setUint32(0, this.participant_id, !0), t.setUint32(4, this.type, !0), t.setUint32(8, this.length, !0), s.set(new Uint8Array(this.data), 12), n;
  }
}
class We {
  static create(e) {
    const n = {
      name: e.name,
      layout: e.layout,
      deviceId: e.deviceId,
      variants: e.variants,
      description: e.description
    }, t = JSON.stringify(n), s = new ArrayBuffer(t.length * 2), c = new Uint8Array(s), r = t.length;
    for (let f = 0; f < r; f++)
      c[f] = t.charCodeAt(f);
    return new Me(0, Le.NewDevice, s);
  }
}
class Be {
  static createStateEvent(e) {
    const n = W.from(e);
    return Be.create(n);
  }
  static create(e) {
    return new Me(0, Le.NewEvents, e.buffer);
  }
}
class kt {
  static create(e) {
    const n = new ArrayBuffer(u.sizeOfInt);
    return new DataView(n).setInt32(e.deviceId), new Me(0, Le.RemoveDevice, n);
  }
}
class Ct {
  static create(e) {
    throw new Error(`ChangeUsageMsg class is not implemented. device=${e}`);
  }
}
class Dt extends EventTarget {
  constructor() {
    super(), this._controllers = {}, window.requestAnimationFrame(this._updateStatus.bind(this));
  }
  addGamepad(e) {
    this._controllers[e.index] = e;
  }
  removeGamepad(e) {
    delete this._controllers[e.index];
  }
  _updateStatus() {
    this._scanGamepad();
    for (const e in this._controllers) {
      const n = this._controllers[e];
      this.dispatchEvent(
        new GamepadEvent("gamepadupdated", {
          gamepad: n
        })
      );
    }
    window.requestAnimationFrame(this._updateStatus.bind(this));
  }
  _scanGamepad() {
    const e = navigator.getGamepads();
    for (let n = 0; n < e.length; n++)
      e[n] && e[n].index in this._controllers && (this._controllers[e[n].index] = e[n]);
  }
}
const M = {
  Vertical: 0,
  Horizontal: 1
};
class Tt {
  constructor(e, n, t) {
    this.reset(e, n, t);
  }
  map(e) {
    const n = this._videoElem.getBoundingClientRect(), t = new Array(2);
    return t[0] = e[0] - n.left, t[1] = e[1] - n.top, t[1] = n.height - t[1], t[0] -= this._contentRect.x, t[1] -= this._contentRect.y, t[0] = t[0] / this._contentRect.width * this._videoWidth, t[1] = t[1] / this._contentRect.height * this._videoHeight, t;
  }
  setVideoWidth(e) {
    this._videoWidth = e, this._reset();
  }
  setVideoHeight(e) {
    this._videoHeight = e, this._reset();
  }
  setRect(e) {
    this._videoElem = e, this._reset();
  }
  reset(e, n, t) {
    this._videoWidth = e, this._videoHeight = n, this._videoElem = t, this._reset();
  }
  get letterBoxType() {
    const e = this._videoHeight / this._videoWidth, n = this._videoElem.getBoundingClientRect(), t = n.height / n.width;
    return e > t ? M.Vertical : M.Horizontal;
  }
  get letterBoxSize() {
    const e = this._videoElem.getBoundingClientRect();
    switch (this.letterBoxType) {
      case M.Horizontal: {
        const n = e.width / this._videoWidth, t = this._videoHeight * n;
        return (e.height - t) * 0.5 | 0;
      }
      case M.Vertical: {
        const n = e.height / this._videoHeight, t = this._videoWidth * n;
        return (e.width - t) * 0.5 | 0;
      }
    }
    throw new Error("invalid status");
  }
  get contentRect() {
    const e = this.letterBoxType, n = this.letterBoxSize, t = this._videoElem.getBoundingClientRect(), s = e == M.Vertical ? n : 0, c = e == M.Horizontal ? n : 0, r = e == M.Vertical ? t.width - n * 2 : t.width, f = e == M.Horizontal ? t.height - n * 2 : t.height;
    return { x: s, y: c, width: r, height: f };
  }
  _reset() {
    this._contentRect = this.contentRect;
  }
}
class Rt extends Et {
  constructor(e) {
    super(), this._devices = [], this._elem = e, this._corrector = new Tt(
      this._elem.videoWidth,
      this._elem.videoHeight,
      this._elem
    ), this._elem.addEventListener("resize", this._onResizeEvent.bind(this), !1), new ResizeObserver(this._onResizeEvent.bind(this)).observe(this._elem);
  }
  addMouse() {
    const e = {
      m_InterfaceName: "RawInput",
      m_DeviceClass: "Mouse",
      m_Manufacturer: "",
      m_Product: "",
      m_Serial: "",
      m_Version: "",
      m_Capabilities: ""
    };
    this.mouse = new yt("Mouse", "Mouse", 1, null, e), this._devices.push(this.mouse), this._elem.addEventListener("click", this._onMouseEvent.bind(this), !1), this._elem.addEventListener("mousedown", this._onMouseEvent.bind(this), !1), this._elem.addEventListener("mouseup", this._onMouseEvent.bind(this), !1), this._elem.addEventListener("mousemove", this._onMouseEvent.bind(this), !1), this._elem.addEventListener("wheel", this._onWheelEvent.bind(this), !1);
  }
  addKeyboard() {
    const e = {
      m_InterfaceName: "RawInput",
      m_DeviceClass: "Keyboard",
      m_Manufacturer: "",
      m_Product: "",
      m_Serial: "",
      m_Version: "",
      m_Capabilities: ""
    };
    this.keyboard = new Je("Keyboard", "Keyboard", 2, null, e), this._devices.push(this.keyboard), document.addEventListener("keyup", this._onKeyEvent.bind(this), !1), document.addEventListener("keydown", this._onKeyEvent.bind(this), !1);
  }
  addGamepad() {
    const e = {
      m_InterfaceName: "RawInput",
      m_DeviceClass: "Gamepad",
      m_Manufacturer: "",
      m_Product: "",
      m_Serial: "",
      m_Version: "",
      m_Capabilities: ""
    };
    this.gamepad = new It("Gamepad", "Gamepad", 3, null, e), this._devices.push(this.gamepad), window.addEventListener("gamepadconnected", this._onGamepadEvent.bind(this), !1), window.addEventListener(
      "gamepaddisconnected",
      this._onGamepadEvent.bind(this),
      !1
    ), this._gamepadHandler = new Dt(), this._gamepadHandler.addEventListener(
      "gamepadupdated",
      this._onGamepadEvent.bind(this),
      !1
    );
  }
  addTouchscreen() {
    const e = {
      m_InterfaceName: "RawInput",
      m_DeviceClass: "Touch",
      m_Manufacturer: "",
      m_Product: "",
      m_Serial: "",
      m_Version: "",
      m_Capabilities: ""
    };
    this.touchscreen = new bt(
      "Touchscreen",
      "Touchscreen",
      4,
      null,
      e
    ), this._devices.push(this.touchscreen), this._elem.addEventListener("touchend", this._onTouchEvent.bind(this), !1), this._elem.addEventListener("touchstart", this._onTouchEvent.bind(this), !1), this._elem.addEventListener("touchcancel", this._onTouchEvent.bind(this), !1), this._elem.addEventListener("touchmove", this._onTouchEvent.bind(this), !1), this._elem.addEventListener("click", this._onTouchEvent.bind(this), !1);
  }
  get devices() {
    return this._devices;
  }
  _onResizeEvent() {
    this._corrector.reset(
      this._elem.videoWidth,
      this._elem.videoHeight,
      this._elem
    );
  }
  _onMouseEvent(e) {
    this.mouse.queueEvent(e), this.mouse.currentState.position = this._corrector.map(this.mouse.currentState.position), this._queueStateEvent(this.mouse.currentState, this.mouse);
  }
  _onWheelEvent(e) {
    this.mouse.queueEvent(e), this._queueStateEvent(this.mouse.currentState, this.mouse);
  }
  _onKeyEvent(e) {
    e.type == "keydown" ? (e.repeat || (this.keyboard.queueEvent(e), this._queueStateEvent(this.keyboard.currentState, this.keyboard)), this._queueTextEvent(this.keyboard, e)) : e.type == "keyup" && (this.keyboard.queueEvent(e), this._queueStateEvent(this.keyboard.currentState, this.keyboard));
  }
  _onTouchEvent(e) {
    this.touchscreen.queueEvent(e, this.timeSinceStartup);
    for (const n of this.touchscreen.currentState.touchData) {
      const t = n.copy();
      t.position = this._corrector.map(t.position), this._queueStateEvent(t, this.touchscreen);
    }
  }
  _onGamepadEvent(e) {
    switch (e.type) {
      case "gamepadconnected": {
        this._gamepadHandler.addGamepad(e.gamepad);
        break;
      }
      case "gamepaddisconnected": {
        this._gamepadHandler.removeGamepad(e.gamepad);
        break;
      }
      case "gamepadupdated": {
        this.gamepad.queueEvent(e), this._queueStateEvent(this.gamepad.currentState, this.gamepad);
        break;
      }
    }
  }
  _queueStateEvent(e, n) {
    const t = W.fromState(
      e,
      n.deviceId,
      this.timeSinceStartup
    ), s = new CustomEvent("event", { detail: { event: t, device: n } });
    super.onEvent.dispatchEvent(s);
  }
  _queueTextEvent(e, n) {
    const t = he.create(
      e.deviceId,
      n,
      this.timeSinceStartup
    ), s = new CustomEvent("event", { detail: { event: t, device: e } });
    super.onEvent.dispatchEvent(s);
  }
  _queueDeviceChange(e, n) {
    const t = new CustomEvent("changedeviceusage", {
      detail: { device: e, usage: n }
    });
    super.onEvent.dispatchEvent(t);
  }
}
class Lt {
  constructor(e) {
    this.channel = e;
  }
  onNext(e) {
    this.channel == null || this.channel.readyState != "open" || this.channel.send(e.buffer);
  }
}
const Mt = {
  key: 0,
  class: "overlay overlay-info"
}, Bt = {
  key: 1,
  class: "overlay overlay-info"
}, At = { class: "loading-container" }, xt = {
  key: 0,
  class: "retry-hint"
}, zt = {
  key: 2,
  class: "overlay overlay-warning"
}, Ft = { class: "loading-container" }, Ot = { class: "retry-hint" }, Pt = {
  key: 3,
  class: "overlay overlay-error"
}, qt = { class: "error-container" }, Ut = {
  key: 0,
  class: "error-detail"
}, Gt = {
  key: 4,
  class: "overlay overlay-success"
}, Nt = /* @__PURE__ */ ct({
  __name: "index",
  props: {
    signalingUrl: {},
    autoFullscreen: { type: Boolean },
    contentHint: {},
    fit: {},
    enableReconnect: { type: Boolean },
    maxReconnectAttempts: {},
    reconnectInterval: {},
    reconnectBackoffMultiplier: {},
    maxReconnectInterval: {},
    showConnectedIndicator: { type: Boolean },
    onConnect: { type: Function },
    onDisconnect: { type: Function },
    onError: { type: Function },
    onStatusChange: { type: Function },
    onDataReceived: { type: Function },
    onDataChannelOpen: { type: Function },
    onDataChannelClose: { type: Function },
    dataChannelLabel: {}
  },
  emits: ["connect", "disconnect", "error", "status-change", "data-received", "datachannel-open", "datachannel-close"],
  setup(l, { expose: e, emit: n }) {
    const t = l, s = n, c = I(() => t.autoFullscreen ?? !1), r = I(() => t.contentHint ?? "detail"), f = I(() => t.fit ?? "contain"), D = I(() => t.enableReconnect ?? !0), ee = I(() => t.maxReconnectAttempts ?? 3), ge = I(() => t.reconnectInterval ?? 1e3), ve = I(() => t.reconnectBackoffMultiplier ?? 2), we = I(() => t.maxReconnectInterval ?? 3e4), te = I(() => t.showConnectedIndicator ?? !1), q = O(null), E = O(null), T = O("idle"), me = O(null), B = O(0), U = O(""), b = O(""), Ae = I(() => !!t.signalingUrl), Ke = I(() => me.value ? { aspectRatio: me.value } : void 0);
    let ne = null, A = 0, x = !1, p = null, v = null, G = null, N = null, z = null, $ = null, m = null, J = null, K = null, X = null, _e = !1, se = !1, ye = null, be = null, Ie = null, Ee = null;
    function H(i) {
      var d;
      const a = T.value;
      a !== i && (T.value = i, (d = t.onStatusChange) == null || d.call(t, i, a), s("status-change", i, a));
    }
    function xe(i, a, d = !0) {
      return {
        type: i,
        message: a,
        timestamp: Date.now(),
        retryable: d
      };
    }
    function ze(i) {
      var a;
      U.value = i.message, (a = t.onError) == null || a.call(t, i), s("error", i);
    }
    dt(() => {
      Ae.value && ae(), K = () => {
        F();
      }, window.addEventListener("resize", K, { passive: !0 }), X = () => {
        F();
      }, document.addEventListener("fullscreenchange", X, { passive: !0 }), q.value && "ResizeObserver" in window && (J = new ResizeObserver(() => F()), J.observe(q.value));
    }), Te(
      () => t.signalingUrl,
      async (i, a) => {
        i !== a && (ie(), A = 0, B.value = 0, x = !1, await Se(), U.value = "", i ? ae() : H("idle"));
      }
    ), Te(
      () => t.autoFullscreen,
      async (i) => {
        i && (await lt(), await Pe());
      }
    ), Te(
      () => t.fit,
      () => F()
    );
    function ie() {
      ne && (clearTimeout(ne), ne = null);
    }
    function Fe() {
      if (!D.value || x) return;
      if (A >= ee.value) {
        H("error"), ze(xe("websocket", "重连次数已达上限，请检查网络或服务端状态", !1));
        return;
      }
      A++, B.value = A, H("reconnecting");
      const i = Math.min(
        ge.value * Math.pow(ve.value, A - 1),
        we.value
      );
      ne = setTimeout(() => {
        !x && t.signalingUrl && ae();
      }, i);
    }
    async function Oe() {
      ie(), A = 0, B.value = 0, x = !1, U.value = "", await Se(), await ae();
    }
    async function ae() {
      var i;
      try {
        if (!t.signalingUrl)
          return;
        H("connecting"), x = !1, p = new ft(), await new Promise((d, o) => {
          p.websocket = new WebSocket(t.signalingUrl), p.websocket.onopen = () => {
            p.isWsOpen = !0, d();
          }, p.websocket.onclose = (h) => {
            p.isWsOpen = !1;
            const k = h.wasClean ? "连接正常关闭" : "连接异常断开";
            o(new Error(`WebSocket ${k}`));
          }, p.websocket.onerror = () => {
            o(new Error("WebSocket connection error"));
          };
        }), p.websocket.onmessage = (d) => {
          const o = JSON.parse(d.data);
          if (!(!o || !p))
            switch (o.type) {
              case "connect":
                p.dispatchEvent(new CustomEvent("connect", { detail: o }));
                break;
              case "disconnect":
                p.dispatchEvent(new CustomEvent("disconnect", { detail: o }));
                break;
              case "offer":
                p.dispatchEvent(new CustomEvent("offer", { detail: { connectionId: o.from, sdp: o.data.sdp, polite: o.data.polite } }));
                break;
              case "answer":
                p.dispatchEvent(new CustomEvent("answer", { detail: { connectionId: o.from, sdp: o.data.sdp } }));
                break;
              case "candidate":
                p.dispatchEvent(new CustomEvent("candidate", { detail: { connectionId: o.from, candidate: o.data.candidate, sdpMLineIndex: o.data.sdpMLineIndex, sdpMid: o.data.sdpMid } }));
                break;
              default:
                break;
            }
        }, p.websocket.onclose = () => {
          var d, o;
          if (p.isWsOpen = !1, !x && T.value !== "error") {
            const h = b.value;
            b.value = "", m && (m = null, (d = t.onDataChannelClose) == null || d.call(t, h), s("datachannel-close", h)), (o = t.onDisconnect) == null || o.call(t, h, "websocket_closed"), s("disconnect", h, "websocket_closed"), Fe();
          }
        }, v = new vt(p, {}), v.onAddChannel = (d) => {
          const o = d.channel;
          o && (o.label === "input" && E.value ? ($ = o, qe(E.value, $)) : o.label === (t.dataChannelLabel || "data") && (m = o, Ue(m)));
        }, v.onConnect = () => {
          try {
            $ = v.createDataChannel("input"), E.value && $ && qe(E.value, $);
            const d = t.dataChannelLabel || "data";
            m = v.createDataChannel(d), Ue(m);
          } catch (d) {
            console.warn("Failed to setup onConnect handlers:", d);
          }
        }, v.onTrackEvent = (d) => {
          if (G || (G = new MediaStream()), d.track)
            try {
              typeof r.value == "string" && "contentHint" in d.track && (d.track.contentHint = r.value), G.addTrack(d.track);
            } catch (o) {
              console.warn("Failed to add track to stream:", o);
            }
          E.value && G.getTracks().length > 0 && (E.value.srcObject = G, Xe(E.value), F(), c.value && Pe());
        }, await v.start();
        const a = await v.createConnection();
        b.value = (a == null ? void 0 : a.connectionId) || "", A = 0, B.value = 0, U.value = "", H("connected"), (i = t.onConnect) == null || i.call(t, b.value), s("connect", b.value);
      } catch (a) {
        console.error("Error initializing connection:", a);
        const d = (a == null ? void 0 : a.message) || "未知错误", o = d.includes("WebSocket") || d.includes("连接");
        ze(xe(
          d.includes("WebSocket") ? "websocket" : "webrtc",
          d,
          o
        )), H("error"), o && D.value && Fe();
      }
    }
    function Xe(i) {
      if (!i) return;
      const a = () => {
        const d = i.videoWidth, o = i.videoHeight;
        d && o && (me.value = `${d} / ${o}`);
      };
      i.onloadedmetadata = () => {
        a(), F();
      }, "onresize" in i && (i.onresize = () => {
        a(), F();
      });
    }
    async function Pe() {
      if (_e || se) return;
      const i = q.value;
      if (!(!i || !c.value || document.fullscreenElement || !(typeof document.fullscreenEnabled != "boolean" || document.fullscreenEnabled || typeof i.webkitRequestFullscreen == "function")))
        try {
          se = !0, typeof i.requestFullscreen == "function" ? await i.requestFullscreen() : typeof i.webkitRequestFullscreen == "function" && i.webkitRequestFullscreen(), _e = !0;
        } catch {
          se = !1;
        }
    }
    function F() {
      const i = E.value, a = q.value;
      !i || !a || (i.style.width = "100%", i.style.height = "100%", i.style.objectFit = f.value, a.offsetHeight);
    }
    function S(i) {
      return typeof i == "number" ? i : typeof i == "string" && i.trim() !== "" && !Number.isNaN(Number(i)) ? Number(i) : null;
    }
    function Ye(i) {
      var d;
      let a = null;
      return (d = i == null ? void 0 : i.forEach) == null || d.call(i, (o) => {
        o.type === "candidate-pair" && (o.selected || o.nominated) && (a = o);
      }), a;
    }
    function je(i) {
      var d;
      let a = null;
      return (d = i == null ? void 0 : i.forEach) == null || d.call(i, (o) => {
        if (o.type !== "inbound-rtp" || (o.kind || o.mediaType) !== "video") return;
        a || (a = o);
        const k = S(o.bytesReceived), Y = S(a.bytesReceived);
        k != null && (Y == null || k > Y) && (a = o);
      }), a;
    }
    function Qe(i, a) {
      var o;
      if (!a) return null;
      let d = null;
      return (o = i == null ? void 0 : i.forEach) == null || o.call(i, (h) => {
        h.id === a && h.type === "codec" && (d = h);
      }), d;
    }
    async function Ze() {
      var He;
      const i = E.value, a = (i == null ? void 0 : i.videoWidth) || null, d = (i == null ? void 0 : i.videoHeight) || null;
      let o = null;
      try {
        o = await ((He = v == null ? void 0 : v.getStats) == null ? void 0 : He.call(v));
      } catch {
      }
      const h = o ? je(o) : null, k = o && (h != null && h.codecId) ? Qe(o, h.codecId) : null, Y = o ? Ye(o) : null, oe = performance.now();
      let Ge = null;
      const ke = h ? S(h.bytesReceived) : null;
      if (ke != null) {
        if (ye != null && be != null) {
          const V = (oe - be) / 1e3;
          if (V > 0.2) {
            const j = ke - ye;
            j >= 0 && (Ge = j * 8 / 1e3 / V);
          }
        }
        ye = ke, be = oe;
      }
      let Ce = h ? S(h.framesPerSecond) : null;
      const De = h ? S(h.framesDecoded) : null;
      if (Ce == null && De != null) {
        if (Ie != null && Ee != null) {
          const V = (oe - Ee) / 1e3;
          if (V > 0.2) {
            const j = De - Ie;
            j >= 0 && (Ce = j / V);
          }
        }
        Ie = De, Ee = oe;
      }
      const nt = h ? S(h.packetsLost) : null, Ne = h ? S(h.jitter) : null, st = Ne != null ? Ne * 1e3 : null, it = h ? S(h.framesDropped) : null, $e = Y ? S(Y.currentRoundTripTime) : null, at = $e != null ? $e * 1e3 : null, ot = (k == null ? void 0 : k.mimeType) || null, rt = k ? S(k.clockRate) : null;
      return {
        width: a,
        height: d,
        bitrateKbps: Ge,
        fps: Ce,
        packetsLost: nt,
        jitterMs: st,
        rttMs: at,
        framesDropped: it,
        codec: ot,
        clockRate: rt
      };
    }
    function qe(i, a) {
      z = new Rt(i), z.addMouse(), z.addKeyboard(), ("ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) && z.addTouchscreen(), z.addGamepad(), N = new St(z), a.onopen = async () => {
        await new Promise((d) => setTimeout(d, 100)), N.startSending();
      }, N.subscribe(new Lt(a));
    }
    function Ue(i) {
      i.onopen = () => {
        var a;
        console.log(`DataChannel '${i.label}' opened`), (a = t.onDataChannelOpen) == null || a.call(t, b.value), s("datachannel-open", b.value);
      }, i.onclose = () => {
        var a;
        console.log(`DataChannel '${i.label}' closed`), (a = t.onDataChannelClose) == null || a.call(t, b.value), s("datachannel-close", b.value);
      }, i.onmessage = (a) => {
        var o;
        const d = {
          data: a.data,
          timestamp: Date.now(),
          connectionId: b.value
        };
        (o = t.onDataReceived) == null || o.call(t, d), s("data-received", d);
      }, i.onerror = (a) => {
        console.error(`DataChannel '${i.label}' error:`, a);
      };
    }
    function et(i) {
      if (!m || m.readyState !== "open")
        return console.warn("DataChannel is not ready, cannot send data"), !1;
      try {
        const a = typeof i == "string" ? i : JSON.stringify(i);
        return m.send(a), !0;
      } catch (a) {
        return console.error("Failed to send data:", a), !1;
      }
    }
    function tt(i) {
      if (!m || m.readyState !== "open")
        return console.warn("DataChannel is not ready, cannot send binary data"), !1;
      try {
        return m.send(i), !0;
      } catch (a) {
        return console.error("Failed to send binary data:", a), !1;
      }
    }
    async function Se() {
      var i;
      if (ie(), N && N.stopSending(), N = null, z = null, $ = null, m) {
        const a = b.value;
        m = null, (i = t.onDataChannelClose) == null || i.call(t, a), s("datachannel-close", a);
      }
      _e = !1, se = !1, v && await v.stop(), p && await p.stop(), p = null, v = null, G = null;
    }
    return ut(async () => {
      x = !0, ie(), J && q.value && J.disconnect(), J = null, K && window.removeEventListener("resize", K), K = null, X && document.removeEventListener("fullscreenchange", X), X = null, await Se();
    }), e({
      getDiagnostics: Ze,
      reconnect: Oe,
      connectionStatus: T,
      sendData: et,
      sendBinaryData: tt
    }), (i, a) => (R(), L("div", {
      ref_key: "playerRef",
      ref: q,
      class: "player",
      style: ht(Ke.value),
      onContextmenu: a[0] || (a[0] = Ve(() => {
      }, ["prevent"]))
    }, [
      T.value === "idle" && !Ae.value ? (R(), L("div", Mt, [...a[1] || (a[1] = [
        _("span", null, "未配置信令地址", -1)
      ])])) : T.value === "connecting" ? (R(), L("div", Bt, [
        _("div", At, [
          a[2] || (a[2] = _("div", { class: "loading-spinner" }, null, -1)),
          a[3] || (a[3] = _("span", null, "连接中...", -1)),
          B.value > 0 ? (R(), L("span", xt, "第 " + re(B.value) + " 次重试", 1)) : ce("", !0)
        ])
      ])) : T.value === "reconnecting" ? (R(), L("div", zt, [
        _("div", Ft, [
          a[4] || (a[4] = _("div", { class: "loading-spinner" }, null, -1)),
          a[5] || (a[5] = _("span", null, "连接断开，正在重连...", -1)),
          _("span", Ot, "第 " + re(B.value) + " 次重试 / 最多 " + re(ee.value) + " 次", 1)
        ])
      ])) : T.value === "error" ? (R(), L("div", Pt, [
        _("div", qt, [
          a[6] || (a[6] = _("span", null, "连接失败", -1)),
          U.value ? (R(), L("span", Ut, re(U.value), 1)) : ce("", !0),
          D.value ? (R(), L("button", {
            key: 1,
            class: "retry-btn",
            onClick: Ve(Oe, ["stop"])
          }, " 点击重试 ")) : ce("", !0)
        ])
      ])) : T.value === "connected" && te.value ? (R(), L("div", Gt, [...a[7] || (a[7] = [
        _("span", null, "已连接", -1)
      ])])) : ce("", !0),
      _("video", {
        ref_key: "videoRef",
        ref: E,
        class: "video",
        autoplay: "",
        playsinline: "",
        muted: ""
      }, null, 512)
    ], 36));
  }
}), $t = (l, e) => {
  const n = l.__vccOpts || l;
  for (const [t, s] of e)
    n[t] = s;
  return n;
}, Ht = /* @__PURE__ */ $t(Nt, [["__scopeId", "data-v-5f1e8988"]]), Wt = {
  install(l) {
    l.component("UnityStreamPlayer", Ht);
  }
};
export {
  Ht as UnityStreamPlayer,
  Wt as default
};
