// Normalized input consumed by FlightModel each physics tick
export interface ControlInput {
  pitch: number;     // [-1, 1]  positive = nose down
  roll: number;      // [-1, 1]  positive = right roll
  throttle: number;  // [ 0, 1]
  fire: boolean;
  missile: boolean;
}

export function defaultInput(): ControlInput {
  return { pitch: 0, roll: 0, throttle: 0.6, fire: false, missile: false };
}
