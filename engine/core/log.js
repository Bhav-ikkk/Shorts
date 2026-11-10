import fs from 'node:fs';
import path from 'node:path';
import { getProjectBuildDir } from './paths.js';

export class Logger {
  constructor(projectName, stage) {
    this.projectName = projectName;
    this.stage = stage;
    this.logDir = path.join(getProjectBuildDir(projectName), 'logs');
    fs.mkdirSync(this.logDir, { recursive: true });
    this.logFile = path.join(this.logDir, `${stage}.jsonl`);
    this.startTime = Date.now();
  }

  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      elapsedMs: Date.now() - this.startTime,
      level,
      stage: this.stage,
      message,
      ...data
    };
    fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n', 'utf8');
    if (level === 'error') {
      console.error(`[${this.stage.toUpperCase()}] ERROR: ${message}`);
    } else if (level === 'warn') {
      console.warn(`[${this.stage.toUpperCase()}] WARN: ${message}`);
    } else {
      console.log(`[${this.stage.toUpperCase()}] ${message}`);
    }
  }

  info(msg, data) { this.log('info', msg, data); }
  warn(msg, data) { this.log('warn', msg, data); }
  error(msg, data) { this.log('error', msg, data); }
}

