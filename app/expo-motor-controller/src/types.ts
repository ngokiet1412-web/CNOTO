export type MotorDirection = 'FWD' | 'REV' | 'STOP';

export type GearPosition = 'P' | 'R' | 'N' | 'D';

export type DriveMode = 'ECO' | 'NORMAL' | 'SPORT';

export type ConnectionStatus = 'connected_ws' | 'connected_http' | 'connecting' | 'disconnected';

export interface CockpitTheme {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  glow: string;
  softBg: string;
  border: string;
}

export interface Esp32Telemetry {
  type?: string;
  dir: MotorDirection;
  speed: number;
  targetPwm: number;
  actualPwm: number;
  signedPwm: number;
  rpwm: number;
  lpwm: number;
  en: number;
  maxPwm: number;
  softReverse: boolean;
  invert: boolean;
  failsafe: boolean;
  // Micro Servo 9g telemetry
  servoAngle: number;
  appliedServoAngle: number;
  servoUs: number;
  servoTrim: number;
  servoSwing: number;
  invertServo: boolean;
  // Cảm biến tốc độ Encoder V2 telemetry
  rpm: number;
  kmh: number;
  mps: number;
  pulses: number;
  distM: number;
  encLevel: number;
  ppr: number;
  wheelMm: number;
  clients: number;
  uptime: number;
  t?: number;
}

export interface MotorConfigPatch {
  maxPwm?: number;
  softReverse?: boolean;
  invert?: boolean;
  failsafe?: boolean;
  servoTrim?: number;
  servoSwing?: number;
  invertServo?: boolean;
  ppr?: number;
  wheelMm?: number;
}
