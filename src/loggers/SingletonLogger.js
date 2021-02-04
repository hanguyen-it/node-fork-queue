import DefaultLogger from './DefaultLogger';
import LoggerFactory from './LoggerFactory';
import { LOG_LEVELS } from './LoggerFactory';

class SingletonLogger {
  constructor() {
    this.isInit = false;
  }

  initLogger(logLevel, logCreator) {
    if (this.isInit) {
      return;
    }

    this.loggerInstance = LoggerFactory.createLogger({
      level: logLevel || LOG_LEVELS.INFO,
      logCreator: logCreator || DefaultLogger,
    });

    this.isInit = true;
  }

  info(message, extra = {}) {
    this.loggerInstance.info(message, extra);
  }

  error(message, extra = {}) {
    this.loggerInstance.error(message, extra);
  }

  warn(message, extra = {}) {
    this.loggerInstance.warn(message, extra);
  }

  debug(message, extra = {}) {
    this.loggerInstance.debug(message, extra);
  }
}

export default new SingletonLogger();
