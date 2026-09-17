export interface WheelItem {
  id: string;
  name: string;
  color: string;
  weight: number; // Relative weight (e.g., 1 to 100)
  enabled: boolean;
}

export interface SpinResult {
  id: string;
  itemId: string;
  itemName: string;
  itemColor: string;
  percentage: number;
  timestamp: number;
}

export type SpinDurationPreset = 3 | 5 | 8 | 12;

export interface WheelConfig {
  spinDuration: SpinDurationPreset;
  soundEnabled: boolean;
  confettiEnabled: boolean;
  removeWinnerOnWin: boolean;
  showPercentageOnWheel: boolean;
  equalSliceVisuals: boolean; // Keep visual slice sizes equal so boosted weights do not expand slice color
}
