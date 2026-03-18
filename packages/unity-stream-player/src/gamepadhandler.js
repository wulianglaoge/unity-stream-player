export class GamepadHandler extends EventTarget {
  constructor() {
    super();
    this._controllers = {};
    window.requestAnimationFrame(this._updateStatus.bind(this));
  }

  addGamepad(gamepad) {
    this._controllers[gamepad.index] = gamepad;
  }

  removeGamepad(gamepad) {
    delete this._controllers[gamepad.index];
  }

  _updateStatus() {
    this._scanGamepad();
    for (const i in this._controllers) {
      const controller = this._controllers[i];
      this.dispatchEvent(
        new GamepadEvent("gamepadupdated", {
          gamepad: controller,
        }),
      );
    }
    window.requestAnimationFrame(this._updateStatus.bind(this));
  }

  _scanGamepad() {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].index in this._controllers) {
        this._controllers[gamepads[i].index] = gamepads[i];
      }
    }
  }
}

