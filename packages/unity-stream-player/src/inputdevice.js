import { MemoryHelper } from "./memoryhelper.js";
import { CharNumber } from "./charnumber.js";
import { Keymap } from "./keymap.js";
import { MouseButton } from "./mousebutton.js";
import { GamepadButton } from "./gamepadbutton.js";
import { TouchPhase } from "./touchphase.js";
import { TouchFlags } from "./touchflags.js";

export class FourCC {
  constructor(a, b, c, d) {
    this._code =
      (a.charCodeAt() << 24) |
      (b.charCodeAt() << 16) |
      (c.charCodeAt() << 8) |
      d.charCodeAt();
  }

  toInt32() {
    return this._code;
  }
}

export class InputDevice {
  constructor(name, layout, deviceId, usages, description) {
    this.name = name;
    this.layout = layout;
    this.deviceId = deviceId;
    this.usages = usages;
    this.description = description;
    this._inputState = null;
  }

  updateState(state) {
    this._inputState = state;
  }

  queueEvent(_event) {
    throw new Error("Please implement this method.");
  }

  get currentState() {
    return this._inputState;
  }
}

export class Mouse extends InputDevice {
  queueEvent(event) {
    this.updateState(new MouseState(event));
  }
}

export class Keyboard extends InputDevice {
  static get keycount() {
    return 110;
  }

  queueEvent(event) {
    this.updateState(new KeyboardState(event, this.currentState));
  }
}

export class Touchscreen extends InputDevice {
  queueEvent(event, time) {
    this.updateState(new TouchscreenState(event, this.currentState, time));
  }
}

export class Gamepad extends InputDevice {
  queueEvent(event) {
    this.updateState(new GamepadState(event));
  }
}

export class InputEvent {
  static get invalidEventId() {
    return 0;
  }
  static get size() {
    return 20;
  }

  constructor(type, sizeInBytes, deviceId, time) {
    this.type = type;
    this.sizeInBytes = sizeInBytes;
    this.deviceId = deviceId;
    this.time = time;
    this.eventId = InputEvent.invalidEventId;
  }

  get buffer() {
    const _buffer = new ArrayBuffer(InputEvent.size);
    const view = new DataView(_buffer);
    view.setInt32(0, this.type, true);
    view.setInt16(4, this.sizeInBytes, true);
    view.setInt16(6, this.deviceId, true);
    view.setFloat64(8, this.time, true);
    view.setInt16(16, this.sizeInBytes, true);
    return _buffer;
  }
}

export class IInputState {
  get buffer() {
    throw new Error("Please implement this field");
  }
  get format() {
    throw new Error("Please implement this field");
  }
}

export class MouseState extends IInputState {
  static get size() {
    return 30;
  }
  static get format() {
    return new FourCC("M", "O", "U", "S").toInt32();
  }

  constructor(event) {
    super();
    this.position = [event.clientX, event.clientY];
    this.delta = [event.movementX, -event.movementY];
    this.scroll = [0, 0];
    if (event.type === "wheel") {
      this.scroll = [event.deltaX, event.deltaY];
    }
    this.buttons = new ArrayBuffer(2);

    const left = event.buttons & (1 << 0);
    const right = event.buttons & (1 << 1);
    const middle = event.buttons & (1 << 2);
    const back = event.buttons & (1 << 3);
    const forward = event.buttons & (1 << 4);

    MemoryHelper.writeSingleBit(this.buttons, MouseButton.Left, left);
    MemoryHelper.writeSingleBit(this.buttons, MouseButton.Right, right);
    MemoryHelper.writeSingleBit(this.buttons, MouseButton.Middle, middle);
    MemoryHelper.writeSingleBit(this.buttons, MouseButton.Forward, forward);
    MemoryHelper.writeSingleBit(this.buttons, MouseButton.Back, back);
  }

  get buffer() {
    const size = MouseState.size;
    const buttons = new Uint16Array(this.buttons)[0];
    const _buffer = new ArrayBuffer(size);
    const view = new DataView(_buffer);
    view.setFloat32(0, this.position[0], true);
    view.setFloat32(4, this.position[1], true);
    view.setFloat32(8, this.delta[0], true);
    view.setFloat32(12, this.delta[1], true);
    view.setFloat32(16, this.scroll[0], true);
    view.setFloat32(20, this.scroll[1], true);
    view.setUint16(24, buttons, true);
    view.setUint16(26, this.displayIndex || 0, true);
    view.setUint16(28, this.clickCount || 0, true);
    return _buffer;
  }

  get format() {
    return MouseState.format;
  }
}

export class KeyboardState extends IInputState {
  static get sizeInBits() {
    return Keyboard.keycount;
  }
  static get sizeInBytes() {
    return (KeyboardState.sizeInBits + 7) >> 3;
  }
  static get format() {
    return new FourCC("K", "E", "Y", "S").toInt32();
  }

  constructor(event, state) {
    super();
    if (!state || !state.keys) {
      this.keys = new ArrayBuffer(KeyboardState.sizeInBytes);
    } else {
      this.keys = state.keys;
    }
    let value = false;
    switch (event.type) {
      case "keydown":
        value = true;
        break;
      case "keyup":
        value = false;
        break;
      default:
        throw new Error(`unknown event type ${event.type})`);
    }
    const key = Keymap[event.code];
    MemoryHelper.writeSingleBit(this.keys, key, value);
  }

  get buffer() {
    return this.keys;
  }

  get format() {
    return KeyboardState.format;
  }
}

export class TouchState {
  static get format() {
    return new FourCC("T", "O", "U", "C").toInt32();
  }
  static get size() {
    return 56;
  }
  static incrementTouchId() {
    if (TouchState._currentTouchId === undefined) {
      TouchState._currentTouchId = 0;
    }
    return ++TouchState._currentTouchId;
  }
  static prevTouches() {
    if (TouchState._prevTouches === undefined) {
      TouchState._prevTouches = new Array(10);
    }
    return TouchState._prevTouches;
  }

  constructor(touchId, prevState, position, pressure, radius, phaseId, time) {
    this.touchId = touchId;
    this.position = position != null ? position.slice() : null;
    if (phaseId == TouchPhase.Moved) {
      this.delta = [
        this.position[0] - prevState.position[0],
        this.position[1] - prevState.position[1],
      ];
    } else {
      this.delta = [0, 0];
    }
    this.pressure = pressure;
    this.radius = radius != null ? radius.slice() : null;
    this.phaseId = phaseId;
    this.tapCount = 0;
    this.displayIndex = 0;
    this.flags = 0;
    this.padding = 0;
    if (phaseId == TouchPhase.Began) {
      this.startTime = time;
      this.startPosition = this.position.slice();
    } else {
      this.startTime = prevState != null ? prevState.startTime : null;
      this.startPosition =
        prevState != null ? prevState.startPosition.slice() : null;
    }
  }

  copy() {
    const state = new TouchState();
    state.touchId = this.touchId;
    state.position = this.position.slice();
    state.delta = this.delta.slice();
    state.pressure = this.pressure;
    state.radius = this.radius.slice();
    state.phaseId = this.phaseId;
    state.tapCount = this.tapCount;
    state.displayIndex = this.displayIndex;
    state.flags = this.flags;
    state.padding = this.padding;
    state.startTime = this.startTime;
    state.startPosition = this.startPosition.slice();
    return state;
  }

  get buffer() {
    const size = TouchState.size;
    const _buffer = new ArrayBuffer(size);
    const view = new DataView(_buffer);
    view.setInt32(0, this.touchId, true);
    view.setFloat32(4, this.position[0], true);
    view.setFloat32(8, this.position[1], true);
    view.setFloat32(12, this.delta[0], true);
    view.setFloat32(16, this.delta[1], true);
    view.setFloat32(20, this.pressure, true);
    view.setFloat32(24, this.radius[0], true);
    view.setFloat32(28, this.radius[1], true);
    view.setInt8(32, this.phaseId, true);
    view.setInt8(33, this.tapCount, true);
    view.setInt8(34, this.displayIndex, true);
    view.setInt8(35, this.flags, true);
    view.setInt32(36, this.padding, true);
    view.setFloat64(40, this.startTime, true);
    view.setFloat32(48, this.startPosition[0], true);
    view.setFloat32(52, this.startPosition[1], true);
    return _buffer;
  }

  get format() {
    return TouchState.format;
  }
}

export class TouchscreenState extends IInputState {
  static get maxTouches() {
    return 10;
  }
  static get format() {
    return new FourCC("T", "S", "C", "R").toInt32();
  }
  static convertPhaseId(type) {
    let phaseId = TouchPhase.Stationary;
    switch (type) {
      case "touchstart":
        phaseId = TouchPhase.Began;
        break;
      case "touchend":
        phaseId = TouchPhase.Ended;
        break;
      case "touchmove":
        phaseId = TouchPhase.Moved;
        break;
      case "touchcancel":
        phaseId = TouchPhase.Canceled;
        break;
    }
    return phaseId;
  }

  constructor(event, state, time) {
    super();

    switch (event.type) {
      case "click": {
        this.touchData = new Array(state.touchData.length);
        for (let i = 0; i < state.touchData.length; i++) {
          this.touchData[i] = state.touchData[i];
          if (this.touchData[i].phaseId == TouchPhase.Ended) {
            this.touchData[i].tapCount = 1;
            this.touchData[i].flags |= TouchFlags.Tap;
          }
        }
        break;
      }
      default: {
        const touches = event.changedTouches;
        this.touchData = new Array(touches.length);
        for (let i = 0; i < touches.length; i++) {
          const touch = touches[i];
          const position = [touch.clientX, touch.clientY];
          const phaseId = TouchscreenState.convertPhaseId(event.type);
          const pressure = touch.force;
          const radius = [touch.radiusX, touch.radiusY];

          const touchId =
            phaseId == TouchPhase.Began
              ? TouchState.incrementTouchId()
              : TouchState.prevTouches()[touch.identifier].touchId;
          const prevState =
            phaseId != TouchPhase.Began
              ? TouchState.prevTouches()[touch.identifier]
              : null;
          const touchData = new TouchState(
            touchId,
            prevState,
            position,
            pressure,
            radius,
            phaseId,
            time,
          );

          TouchState.prevTouches()[touch.identifier] = touchData;
          this.touchData[i] = touchData;
        }
        break;
      }
    }
  }

  get buffer() {
    const size = TouchState.size * this.touchData.length;
    const _buffer = new ArrayBuffer(size);
    const view = new Uint8Array(_buffer);
    for (let i = 0; i < this.touchData.length; i++) {
      view.set(
        new Uint8Array(this.touchData[i].buffer),
        TouchState.size * i,
      );
    }
    return _buffer;
  }

  get format() {
    return TouchscreenState.format;
  }
}

export class GamepadState extends IInputState {
  static get size() {
    return 28;
  }
  static get format() {
    return new FourCC("G", "P", "A", "D").toInt32();
  }

  constructor(event) {
    super();
    const gamepad = event.gamepad;
    const buttons = event.gamepad.buttons;

    this.buttons = new ArrayBuffer(4);
    this.leftStick = [gamepad.axes[0], -gamepad.axes[1]];
    this.rightStick = [gamepad.axes[2], -gamepad.axes[3]];
    this.leftTrigger = buttons[6].value;
    this.rightTrigger = buttons[7].value;

    MemoryHelper.writeSingleBit(this.buttons, GamepadButton.A, buttons[0].pressed);
    MemoryHelper.writeSingleBit(this.buttons, GamepadButton.B, buttons[1].pressed);
    MemoryHelper.writeSingleBit(this.buttons, GamepadButton.X, buttons[2].pressed);
    MemoryHelper.writeSingleBit(this.buttons, GamepadButton.Y, buttons[3].pressed);
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.LeftShoulder,
      buttons[4].pressed,
    );
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.RightShoulder,
      buttons[5].pressed,
    );
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.LeftTrigger,
      buttons[6].pressed,
    );
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.RightTrigger,
      buttons[7].pressed,
    );
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.Select,
      buttons[8].pressed,
    );
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.Start,
      buttons[9].pressed,
    );
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.LeftStick,
      buttons[10].pressed,
    );
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.RightStick,
      buttons[11].pressed,
    );
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.DpadUp,
      buttons[12].pressed,
    );
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.DpadDown,
      buttons[13].pressed,
    );
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.DpadLeft,
      buttons[14].pressed,
    );
    MemoryHelper.writeSingleBit(
      this.buttons,
      GamepadButton.DpadRight,
      buttons[15].pressed,
    );
  }

  get buffer() {
    const size = GamepadState.size;
    const _buffer = new ArrayBuffer(size);
    const view = new DataView(_buffer);
    view.setUint32(0, new Uint32Array(this.buttons)[0], true);
    view.setFloat32(4, this.leftStick[0], true);
    view.setFloat32(8, this.leftStick[1], true);
    view.setFloat32(12, this.rightStick[0], true);
    view.setFloat32(16, this.rightStick[1], true);
    view.setFloat32(20, this.leftTrigger, true);
    view.setFloat32(24, this.rightTrigger, true);
    return _buffer;
  }

  get format() {
    return GamepadState.format;
  }
}

export class TextEvent {
  static get format() {
    return new FourCC("T", "E", "X", "T").toInt32();
  }

  static create(deviceId, event, time) {
    const eventSize = InputEvent.size + MemoryHelper.sizeOfInt;

    const textEvent = new TextEvent();
    textEvent.baseEvent = new InputEvent(TextEvent.format, eventSize, deviceId, time);
    textEvent.character = CharNumber[event.key] || 0;
    return textEvent;
  }

  get buffer() {
    const size = InputEvent.size + MemoryHelper.sizeOfInt;
    const _buffer = new ArrayBuffer(size);
    const arrayView = new Uint8Array(_buffer);
    const dataView = new DataView(_buffer);
    arrayView.set(new Uint8Array(this.baseEvent.buffer), 0);
    dataView.setInt32(InputEvent.size, this.character, true);
    return _buffer;
  }
}

export class StateEvent {
  static get format() {
    return new FourCC("S", "T", "A", "T").toInt32();
  }

  static from(device, time) {
    return StateEvent.fromState(device.currentState, device.deviceId, time);
  }

  static fromState(state, deviceId, time) {
    const stateData = state.buffer;
    const stateSize = stateData.byteLength;
    const eventSize = InputEvent.size + MemoryHelper.sizeOfInt + stateSize;

    const stateEvent = new StateEvent();
    stateEvent.baseEvent = new InputEvent(
      StateEvent.format,
      eventSize,
      deviceId,
      time,
    );
    stateEvent.stateFormat = state.format;
    stateEvent.stateData = stateData;
    return stateEvent;
  }

  get buffer() {
    const stateSize = this.stateData.byteLength;
    const size = InputEvent.size + MemoryHelper.sizeOfInt + stateSize;
    const _buffer = new ArrayBuffer(size);
    const uint8View = new Uint8Array(_buffer);
    const dataView = new DataView(_buffer);
    uint8View.set(new Uint8Array(this.baseEvent.buffer), 0);
    dataView.setInt32(InputEvent.size, this.stateFormat, true);
    uint8View.set(
      new Uint8Array(this.stateData),
      InputEvent.size + MemoryHelper.sizeOfInt,
    );
    return _buffer;
  }
}

