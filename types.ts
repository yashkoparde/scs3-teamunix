

export enum RiskLevel {
  SAFE = 'Safe',
  MODERATE = 'Moderate',
  HIGH = 'High',
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CrowdData {
  totalCount: number;
  density: number; // people per square meter (hypothetical)
  riskLevel: RiskLevel;
  congestionPoints: { x: number; y: number }[];
  detections: BoundingBox[];
  recommendations: string[];
  timestamp: number;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}
