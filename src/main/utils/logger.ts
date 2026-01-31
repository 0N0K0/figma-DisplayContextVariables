/**
 * Logger système pour envoyer les logs vers l'UI
 */

import { LogLevel, LogMessage } from "../../common/types/loggerTypes";

class Logger {
  private logs: LogMessage[] = [];

  async log(level: LogLevel, message: string, data?: any, context?: string) {
    let finalMessage = message;
    let finalContext = context;

    // Extraction automatique du contexte si présent entre crochets au début du message
    if (!finalContext && finalMessage.trim().startsWith("[")) {
      const match = finalMessage.match(/^\[(.*?)]\s*(.*)/);
      if (match) {
        finalContext = match[1];
        finalMessage = match[2];
      }
    }

    const logMessage: LogMessage = {
      timestamp: Date.now(),
      level,
      message: finalMessage,
      data,
      context: finalContext,
    };

    this.logs.push(logMessage);

    // Envoyer à l'UI
    figma.ui.postMessage({
      type: "log",
      log: { ...logMessage },
    });

    await new Promise<void>((r) => setTimeout(r, 0));
  }

  async info(message: string, data?: any, context?: string) {
    await this.log("info", message, data, context);
  }

  async success(message: string, data?: any, context?: string) {
    await this.log("success", message, data, context);
  }

  async warn(message: string, data?: any, context?: string) {
    await this.log("warn", message, data, context);
  }

  async error(message: string, data?: any, context?: string) {
    await this.log("error", message, data, context);
  }

  async debug(message: string, data?: any, context?: string) {
    await this.log("debug", message, data, context);
  }

  clear() {
    this.logs = [];
    figma.ui.postMessage({
      type: "clearLogs",
    });
  }

  getLogs(): LogMessage[] {
    return [...this.logs];
  }
}

export const logger = new Logger();
