const axisActivationThreshold: number = 0.5;

export const gamepadEventToKeyMap: GamepadControlsObjType = {
  Cross: (gp) => gp.buttons[0].pressed, // A for XBox
  Circle: (gp) => gp.buttons[1].pressed, // B for XBox
  Square: (gp) => gp.buttons[2].pressed, // X for XBox
  Triangle: (gp) => gp.buttons[3].pressed, // Y for XBox
  // Different naming for non-PS gamepads: bumper instead of 1, trigger instead of 2
  L1: (gp) => gp.buttons[4].pressed,
  R1: (gp) => gp.buttons[5].pressed,
  L2: (gp) => gp.buttons[6].pressed,
  R2: (gp) => gp.buttons[7].pressed,
  // or "Create", according to PS5 specs
  Share: (gp) => gp.buttons[8].pressed, // Back for XBox
  Options: (gp) => gp.buttons[9].pressed, // Start for XBox
  LeftAnalog: (gp) => gp.buttons[10].pressed,
  RightAnalog: (gp) => gp.buttons[11].pressed,
  DPadUp: (gp) => gp.buttons[12].pressed,
  DPadDown: (gp) => gp.buttons[13].pressed,
  DPadLeft: (gp) => gp.buttons[14].pressed,
  DPadRight: (gp) => gp.buttons[15].pressed,
  // or Mute button, haven't figured it out yet
  PS: (gp) => gp.buttons[16].pressed,
  LStickRight: (gp) => gp.axes[0] > axisActivationThreshold,
  LStickUp: (gp) => gp.axes[1] < -axisActivationThreshold,
  LStickDown: (gp) => gp.axes[1] > axisActivationThreshold,
  LStickLeft: (gp) => gp.axes[0] < -axisActivationThreshold,
  RStickRight: (gp) => gp.axes[2] > axisActivationThreshold,
  RStickUp: (gp) => gp.axes[3] < -axisActivationThreshold,
  RStickDown: (gp) => gp.axes[3] > axisActivationThreshold,
  RStickLeft: (gp) => gp.axes[2] < -axisActivationThreshold,
  // TODO: will we use L2, R2 (indexes 4, 5) activation thresholds?
} as const;

export type GamepadControlsObjType = Record<string, (gp: Gamepad) => boolean>;

// TODO: gamepad layouts (e.g. PS4, PS3, XBox, ...)
