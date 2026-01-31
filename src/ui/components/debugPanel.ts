/**
 * Debug Panel pour afficher les logs
 */

import { LogMessage } from "../../common/types/loggerTypes";

export class DebugPanel {
  private logs: LogMessage[] = [];
  private panel: HTMLElement | null = null;
  private isVisible = false;
  private filter: Set<LogMessage["level"]> = new Set([
    "info",
    "success",
    "warn",
    "error",
    "debug",
  ]);

  constructor() {
    this.createPanel();
    this.setupMessageListener();
  }

  private createPanel() {
    // Créer le panel
    this.panel = document.createElement("div");
    this.panel.id = "debug-panel";
    this.panel.className = "debug-panel hidden";

    // Header avec titre et boutons
    const header = document.createElement("div");
    header.className = "debug-panel-header";

    const title = document.createElement("h2");
    title.textContent = "Debug Logs";
    header.appendChild(title);

    // Filtres de type de log
    const filterContainer = document.createElement("div");
    filterContainer.className = "debug-panel-filters";
    const levels: LogMessage["level"][] = [
      "info",
      "success",
      "warn",
      "error",
      "debug",
    ];
    levels.forEach((level) => {
      const btn = document.createElement("button");
      btn.className = `debug-filter-btn debug-filter-btn-${level} icon-btn`;
      btn.textContent = this.getIconForLevel(level);
      btn.title = level.charAt(0).toUpperCase() + level.slice(1);
      btn.onclick = () => this.toggleFilter(level, btn);
      btn.setAttribute("data-level", level);
      btn.classList.toggle("active", this.filter.has(level));
      filterContainer.appendChild(btn);
    });
    header.appendChild(filterContainer);

    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "debug-panel-buttons";

    const clearBtn = document.createElement("button");
    clearBtn.innerHTML = '<i class="mdi mdi-refresh"></i>';
    clearBtn.className = "debug-btn icon-btn";
    clearBtn.onclick = () => this.clearLogs();
    buttonsContainer.appendChild(clearBtn);

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = '<i class="mdi mdi-close"></i>';
    closeBtn.className = "debug-btn icon-btn";
    closeBtn.onclick = () => this.hide();
    buttonsContainer.appendChild(closeBtn);

    header.appendChild(buttonsContainer);
    this.panel.appendChild(header);

    // Container pour les logs
    const logsContainer = document.createElement("div");
    logsContainer.id = "debug-logs-container";
    logsContainer.className = "debug-logs-container";
    this.panel.appendChild(logsContainer);

    // Ajouter au body
    document.body.appendChild(this.panel);
  }

  private setupMessageListener() {
    window.addEventListener("message", (event) => {
      const msg = event.data.pluginMessage;
      if (msg.type === "log") {
        this.addLog(msg.log);
      } else if (msg.type === "clearLogs") {
        this.clearLogs();
      }
    });
  }

  addLog(log: LogMessage) {
    this.logs.push(log);
    this.renderLogs();
    this.scrollToBottom();
  }

  private renderLogs() {
    const container = document.getElementById("debug-logs-container");
    if (!container) return;
    container.innerHTML = "";
    this.logs
      .filter((log) => this.filter.has(log.level))
      .forEach((log) => {
        const logElement = document.createElement("div");
        logElement.className = `debug-log-entry debug-log-${log.level}`;
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        const icon = this.getIconForLevel(log.level);
        let content = `<div class="debug-log-time">${timestamp}</div> <div class="debug-log-message-container"><span class="debug-log-icon">${icon}</span> <div class="debug-log-message"><span>${this.escapeHtml(log.context ? `[${log.context}]` : "")}</span><span>${this.escapeHtml(log.message)}</span><div class="debug-log-message-container"></div>`;
        if (log.data !== undefined) {
          content += `<pre class="debug-log-data">${this.escapeHtml(JSON.stringify(log.data, null, 2))}</pre>`;
        }
        logElement.innerHTML = content;
        container.appendChild(logElement);
      });
  }

  private toggleFilter(level: LogMessage["level"], btn: HTMLButtonElement) {
    if (this.filter.has(level)) {
      this.filter.delete(level);
    } else {
      this.filter.add(level);
    }
    btn.classList.toggle("active", this.filter.has(level));
    this.renderLogs();
    this.scrollToBottom();
  }

  private getIconForLevel(level: string): string {
    const icons = {
      info: "ℹ️",
      success: "✅",
      warn: "⚠️",
      error: "❌",
      debug: "🔍",
    };
    return icons[level as keyof typeof icons] || "📝";
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  private scrollToBottom() {
    const container = document.getElementById("debug-logs-container");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  clearLogs() {
    this.logs = [];
    this.renderLogs();
  }

  show() {
    if (this.panel) {
      this.panel.classList.remove("hidden");
      this.isVisible = true;
    }
  }

  hide() {
    if (this.panel) {
      this.panel.classList.add("hidden");
      this.isVisible = false;
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Instance globale
export const debugPanel = new DebugPanel();
