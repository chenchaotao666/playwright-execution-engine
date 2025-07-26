/**
 * 简单的日志系统
 */
class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }

  debug(message, ...args) {
    if (this.levels[this.level] <= this.levels.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.levels[this.level] <= this.levels.info) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.levels[this.level] <= this.levels.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message, ...args) {
    if (this.levels[this.level] <= this.levels.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  success(message, ...args) {
    if (this.levels[this.level] <= this.levels.info) {
      console.log(`%c[SUCCESS] ${message}`, 'color: green', ...args);
    }
  }
}

// 导出给浏览器使用
if (typeof window !== 'undefined') {
  window.PlaywrightLogger = Logger;
}

// Node.js 环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
}

// ES6 模块导出
export default Logger;