
export interface TranscriptionLine {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface SystemStats {
  cpu: number;
  memory: number;
  power: number;
  latency: number;
}
