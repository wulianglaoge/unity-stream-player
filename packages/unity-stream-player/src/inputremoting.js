import { StateEvent } from "./inputdevice.js";
import { MemoryHelper } from "./memoryhelper.js";

export class LocalInputManager {
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
    return Date.now() / 1000 - this.startTime;
  }

  setStartTime(time) {
    this._startTime = time;
  }
}

export const InputDeviceChange = {
  Added: 0,
  Removed: 1,
  Disconnected: 2,
  Reconnected: 3,
  Enabled: 4,
  Disabled: 5,
  UsageChanged: 6,
  ConfigurationChanged: 7,
  Destroyed: 8,
};

export class InputRemoting {
  constructor(manager) {
    this._localManager = manager;
    this._subscribers = [];
    this._sending = false;
  }

  startSending() {
    if (this._sending) return;
    this._sending = true;

    const onEvent = (e) => {
      this._sendEvent(e.detail.event);
    };

    const onDeviceChange = (e) => {
      this._sendDeviceChange(e.detail.device, e.detail.change);
    };

    this._localManager.setStartTime(Date.now() / 1000);
    this._localManager.onEvent.addEventListener("event", onEvent);
    this._localManager.onEvent.addEventListener("changedeviceusage", onDeviceChange);
    this._sendInitialMessages();
  }

  stopSending() {
    if (!this._sending) return;
    this._sending = false;
  }

  subscribe(observer) {
    this._subscribers.push(observer);
  }

  _sendInitialMessages() {
    this._sendAllGeneratedLayouts();
    this._sendAllDevices();
  }

  _sendAllGeneratedLayouts() {
    // no-op for now
  }

  _sendAllDevices() {
    const devices = this._localManager.devices;
    if (!devices) return;
    for (const device of devices) {
      this._sendDevice(device);
    }
  }

  _sendDevice(device) {
    const newDeviceMessage = NewDeviceMsg.create(device);
    this._send(newDeviceMessage);
  }

  _sendEvent(event) {
    const message = NewEventsMsg.create(event);
    this._send(message);
  }

  _sendDeviceChange(device, change) {
    if (!this._subscribers) return;

    let msg = null;
    switch (change) {
      case InputDeviceChange.Added:
        msg = NewDeviceMsg.Create(device);
        break;
      case InputDeviceChange.Removed:
        msg = RemoveDeviceMsg.Create(device);
        break;
      case InputDeviceChange.UsageChanged:
        msg = ChangeUsageMsg.Create(device);
        break;
      default:
        return;
    }
    this._send(msg);
  }

  _send(message) {
    for (const subscriber of this._subscribers) {
      subscriber.onNext(message);
    }
  }
}

export const MessageType = {
  Connect: 0,
  Disconnect: 1,
  NewLayout: 2,
  NewDevice: 3,
  NewEvents: 4,
  RemoveDevice: 5,
  RemoveLayout: 6,
  ChangeUsages: 7,
  StartSending: 8,
  StopSending: 9,
};

export class Message {
  constructor(participantId, type, data) {
    this.participant_id = participantId;
    this.type = type;
    this.length = data.byteLength;
    this.data = data;
  }

  get buffer() {
    const totalSize =
      MemoryHelper.sizeOfInt +
      MemoryHelper.sizeOfInt +
      MemoryHelper.sizeOfInt +
      this.data.byteLength;

    const buffer = new ArrayBuffer(totalSize);
    const dataView = new DataView(buffer);
    const uint8view = new Uint8Array(buffer);
    dataView.setUint32(0, this.participant_id, true);
    dataView.setUint32(4, this.type, true);
    dataView.setUint32(8, this.length, true);
    uint8view.set(new Uint8Array(this.data), 12);
    return buffer;
  }
}

export class NewDeviceMsg {
  static create(device) {
    const data = {
      name: device.name,
      layout: device.layout,
      deviceId: device.deviceId,
      variants: device.variants,
      description: device.description,
    };
    const json = JSON.stringify(data);
    const buffer = new ArrayBuffer(json.length * 2);
    const view = new Uint8Array(buffer);
    const length = json.length;
    for (let i = 0; i < length; i++) {
      view[i] = json.charCodeAt(i);
    }
    return new Message(0, MessageType.NewDevice, buffer);
  }
}

export class NewEventsMsg {
  static createStateEvent(device) {
    const events = StateEvent.from(device);
    return NewEventsMsg.create(events);
  }

  static create(event) {
    return new Message(0, MessageType.NewEvents, event.buffer);
  }
}

export class RemoveDeviceMsg {
  static create(device) {
    const buffer = new ArrayBuffer(MemoryHelper.sizeOfInt);
    const view = new DataView(buffer);
    view.setInt32(device.deviceId);
    return new Message(0, MessageType.RemoveDevice, buffer);
  }
}

export class ChangeUsageMsg {
  static create(device) {
    throw new Error(`ChangeUsageMsg class is not implemented. device=${device}`);
  }
}

