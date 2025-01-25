const axisActivationThreshold: number = 0.5;

// TODO: Xbox -> Connect, Logitech -> Mode keys
export const gamepadEventToKeyMap: GamepadControlsObjType = {
  BottomAction: (gp) => gp.buttons[0].pressed,
  RightAction: (gp) => gp.buttons[1].pressed,
  LeftAction: (gp) => gp.buttons[2].pressed,
  TopAction: (gp) => gp.buttons[3].pressed,
  L1: (gp) => gp.buttons[4].pressed,
  R1: (gp) => gp.buttons[5].pressed,
  L2: (gp) => gp.buttons[6].pressed,
  R2: (gp) => gp.buttons[7].pressed,
  Center1: (gp) => gp.buttons[8].pressed,
  Center2: (gp) => gp.buttons[9].pressed,
  LeftAnalog: (gp) => gp.buttons[10].pressed,
  RightAnalog: (gp) => gp.buttons[11].pressed,
  DPadUp: (gp) => gp.buttons[12].pressed,
  DPadDown: (gp) => gp.buttons[13].pressed,
  DPadLeft: (gp) => gp.buttons[14].pressed,
  DPadRight: (gp) => gp.buttons[15].pressed,
  Center3: (gp) => gp.buttons[16].pressed,
  LStickRight: (gp) => gp.axes[0] > axisActivationThreshold,
  LStickUp: (gp) => gp.axes[1] < -axisActivationThreshold,
  LStickDown: (gp) => gp.axes[1] > axisActivationThreshold,
  LStickLeft: (gp) => gp.axes[0] < -axisActivationThreshold,
  RStickRight: (gp) => gp.axes[2] > axisActivationThreshold,
  RStickUp: (gp) => gp.axes[3] < -axisActivationThreshold,
  RStickDown: (gp) => gp.axes[3] > axisActivationThreshold,
  RStickLeft: (gp) => gp.axes[2] < -axisActivationThreshold,
  // TODO: use L2, R2 (indexes 4, 5) activation thresholds?
} as const;

// TODO: aliases for specific models/generations

const playStationKeyAliases: GamepadKeyAlias = {
  BottomAction: "Cross",
  RightAction: "Circle",
  LeftAction: "Square",
  TopAction: "Triangle",
  Center1: "Share", // for PS4, or "Select" for PS3, or "Create" on PS5
  Center2: "Options",
  Center3: "PS",
} as const;

const xBoxKeyAliases: GamepadKeyAlias = {
  BottomAction: "A",
  RightAction: "B",
  LeftAction: "X",
  TopAction: "Y",
  L1: "LB",
  L2: "LT",
  R1: "RB",
  R2: "RT",
  Centrer1: "Select", // or "Back", or "View", for different models, I suppose; "Back" on Logitech
  Centrer2: "Start", // or "Map/Hide", or "Menu", for different models, I suppose; "Pause" on Logitech
  Center3: "Guide",
} as const;

export const getKeyAlias = async (
  key: keyof typeof gamepadEventToKeyMap,
  layout: GamepadLayout = "PS"
): Promise<string> => {
  let alias: string;
  switch (layout) {
    case "PS":
      alias = playStationKeyAliases[key];
      break;
    case "XBox":
      alias = xBoxKeyAliases[key];
      break;
  }
  return alias ? alias : key;
};

type GamepadKeyAlias = Record<keyof typeof gamepadEventToKeyMap, string>;
export type GamepadControlsObjType = Record<string, (gp: Gamepad) => boolean>;
// TODO: more?
type GamepadLayout = "PS" | "XBox";
