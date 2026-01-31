export type LogLevel = "info" | "success" | "warn" | "error" | "debug";

export interface LogMessage {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}
