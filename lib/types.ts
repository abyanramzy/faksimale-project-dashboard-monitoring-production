export interface ProductionOverview {
  targetBpm: number;
  actualBpm: number;
  bestStableBpm: number;
  totalInput: number;
  totalOutput: number;
  rejectCount: number;
  jamCount: number;
  downtimeMinutes: number;
  machineStatus: "Running" | "Stopped" | "Maintenance";
  aiMode: "Monitor" | "Advisor" | "Assisted Control" | "Closed Loop" | "Exploration";
  currentBottleneck: string;
}

export interface Lane {
  name: string;
  bpm: number;
  totalCount: number;
  status: "Normal" | "Warning" | "Jam" | "Disabled";
  priority: "High" | "Medium" | "Low";
  utilization: number;
  hasJam?: boolean;
}

export interface AIRecommendation {
  decision: string;
  reasoning: string;
  action: string;
  risk: string;
  rollback: string;
  confidence: number;
  recBpm?: number;
}

export interface CommandLogEntry {
  id?: string;
  time: string;
  source: "User" | "AI Agent" | "System";
  command: string;
  validationResult: string;
  status: "Pending" | "Validated" | "Rejected" | "Sent" | "Acknowledged" | "Rolled Back";
  reason: string;
}

export interface AlarmEntry {
  id: string;
  time: string;
  code: string;
  description: string;
  severity: "Critical" | "Warning" | "Info";
  active: boolean;
  cause: string;
  downtimeMinutes?: number;
}

export interface Scenario {
  name: string;
  targetBpm: number;
  actualBpm: number;
  jamCount: number;
  rejectRate: number;
  servoLoad: number;
  motorLoad: number;
  status: "Stable" | "Limit" | "Unstable";
  aiRecommendation: string;
}

export interface HardwareAdvisor {
  bottleneck: string;
  evidence: string;
  recommendedUpgrade: string;
  expectedGain: string;
  priority: "High" | "Medium" | "Low";
}

export interface SafetySettings {
  maxBpmStep: number;
  maxConveyorSpeed: number;
  maxServoLoad: number;
  maxMotorLoad: number;
  maxRejectRate: number;
  maxJamPer10min: number;
  aiWritePermission: "Disabled" | "Recommendation Only" | "Limited Write" | "Closed Loop";
}

export interface SimulationBridgeState {
  status: "Idle" | "Running" | "Paused" | "Resetting";
  bridge: "Mock" | "External API Ready";
  endpoint: string;
  elapsedSeconds: number;
  bottleCount: number;
  lastAction: string;
  message: string;
}

export type SimulationAction = "start" | "pause" | "reset";

export interface ApiEnvelope<T> {
  data: T;
  meta: {
    source: "mock" | "external";
    generatedAt: string;
    simulationEndpoint: string | null;
  };
}
