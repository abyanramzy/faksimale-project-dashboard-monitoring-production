import {
  ProductionOverview,
  Lane,
  Scenario,
  HardwareAdvisor,
  AlarmEntry,
  CommandLogEntry,
  SafetySettings,
  SimulationBridgeState,
} from "./types";

export const mockProductionOverview: ProductionOverview = {
  targetBpm: 120,
  actualBpm: 118.7,
  bestStableBpm: 126,
  totalInput: 14520,
  totalOutput: 14480,
  rejectCount: 12,
  jamCount: 1,
  downtimeMinutes: 4,
  machineStatus: "Running",
  aiMode: "Advisor",
  currentBottleneck: "Lane 3 Accumulation",
};

export const mockLanes: Lane[] = [
  { name: "Lane 1", bpm: 30.2, totalCount: 3620, status: "Normal", priority: "High", utilization: 82 },
  { name: "Lane 2", bpm: 29.8, totalCount: 3590, status: "Normal", priority: "Medium", utilization: 79 },
  { name: "Lane 3", bpm: 27.1, totalCount: 3410, status: "Warning", priority: "Low", utilization: 91, hasJam: false },
  { name: "Lane 4", bpm: 31.6, totalCount: 3860, status: "Normal", priority: "High", utilization: 84 },
];

export const mockScenarios: Scenario[] = [
  {
    name: "Baseline 120 BPM Round Robin",
    targetBpm: 120,
    actualBpm: 118.7,
    jamCount: 1,
    rejectRate: 0.08,
    servoLoad: 62,
    motorLoad: 58,
    status: "Stable",
    aiRecommendation: "Pertahankan. Kondisi optimal untuk produksi reguler.",
  },
  {
    name: "125 BPM Adaptive Routing",
    targetBpm: 125,
    actualBpm: 123.4,
    jamCount: 2,
    rejectRate: 0.15,
    servoLoad: 71,
    motorLoad: 66,
    status: "Stable",
    aiRecommendation: "Aman dijalankan. Monitor servo load secara berkala.",
  },
  {
    name: "130 BPM Adaptive Routing",
    targetBpm: 130,
    actualBpm: 127.1,
    jamCount: 4,
    rejectRate: 0.42,
    servoLoad: 81,
    motorLoad: 74,
    status: "Limit",
    aiRecommendation: "Batas kapasitas diverter. Perlu upgrade servo untuk stabilisasi.",
  },
  {
    name: "135 BPM Stress Test",
    targetBpm: 135,
    actualBpm: 119.8,
    jamCount: 11,
    rejectRate: 1.87,
    servoLoad: 96,
    motorLoad: 88,
    status: "Unstable",
    aiRecommendation: "Tidak disarankan. Hardware bottleneck kritis pada diverter.",
  },
];

export const mockHardwareAdvisor: HardwareAdvisor = {
  bottleneck: "Diverter Cycle Time",
  evidence:
    "Pada target di atas 130 BPM, jam meningkat tajam dan servo load melewati 80%. Cycle time diverter saat ini 500 ms belum cukup untuk distribusi 4 lane secara merata.",
  recommendedUpgrade:
    "Upgrade servo diverter ke model high-torque >=200 Nm atau ganti mekanisme ke rotary diverter dengan cycle time <=300 ms.",
  expectedGain: "145-150 BPM stable capacity",
  priority: "High",
};

export const mockAlarms: AlarmEntry[] = [
  {
    id: "alm-001",
    time: "12 min ago",
    code: "JAM-003",
    description: "Jam terdeteksi pada Lane 3 sensor S3-02",
    severity: "Warning",
    active: false,
    cause: "Akumulasi botol di lane 3 akibat kecepatan conveyor tidak merata",
    downtimeMinutes: 2,
  },
  {
    id: "alm-002",
    time: "45 min ago",
    code: "SERVO-HIGH",
    description: "Servo load melebihi 85% selama Stress Test 135 BPM",
    severity: "Critical",
    active: false,
    cause: "Target BPM melebihi kapasitas diverter hardware",
    downtimeMinutes: 2,
  },
  {
    id: "alm-003",
    time: "2 min ago",
    code: "LANE3-UTIL",
    description: "Lane 3 utilization mencapai 91% dan mendekati batas warning",
    severity: "Warning",
    active: true,
    cause: "Distribusi routing tidak merata, Lane 3 menerima beban berlebih",
    downtimeMinutes: 0,
  },
];

export const mockCommandLog: CommandLogEntry[] = [
  {
    id: "cmd-001",
    time: new Date(Date.now() - 60 * 1000).toLocaleTimeString(),
    source: "System",
    command: "Simulation started - Target 120 BPM, Round Robin",
    validationResult: "OK - dalam batas safety boundary",
    status: "Acknowledged",
    reason: "Auto-start oleh sistem",
  },
  {
    id: "cmd-002",
    time: new Date(Date.now() - 45 * 1000).toLocaleTimeString(),
    source: "AI Agent",
    command: "Analyze production state",
    validationResult: "OK",
    status: "Acknowledged",
    reason: "AI Agent melakukan analisis periodik",
  },
  {
    id: "cmd-003",
    time: new Date(Date.now() - 30 * 1000).toLocaleTimeString(),
    source: "User",
    command: "Run Scenario: 135 BPM Stress Test",
    validationResult: "WARNING - servo load melebihi threshold 80%",
    status: "Validated",
    reason: "User memilih untuk tetap melanjutkan stress test",
  },
  {
    id: "cmd-004",
    time: new Date(Date.now() - 15 * 1000).toLocaleTimeString(),
    source: "AI Agent",
    command: "Rollback - Target BPM dikembalikan ke 120",
    validationResult: "OK - rollback condition terpenuhi (jam > 2x)",
    status: "Acknowledged",
    reason: "Rollback otomatis karena jam count melebihi batas",
  },
];

export const mockSafetySettings: SafetySettings = {
  maxBpmStep: 5,
  maxConveyorSpeed: 95,
  maxServoLoad: 80,
  maxMotorLoad: 85,
  maxRejectRate: 1.0,
  maxJamPer10min: 2,
  aiWritePermission: "Recommendation Only",
};

export const mockSimulationBridge: SimulationBridgeState = {
  status: "Idle",
  bridge: "Mock",
  endpoint: "/api/simulation",
  elapsedSeconds: 0,
  bottleCount: 0,
  lastAction: "idle",
  message: "Bridge siap. Endpoint eksternal dapat dihubungkan lewat SIMULATION_API_URL.",
};
