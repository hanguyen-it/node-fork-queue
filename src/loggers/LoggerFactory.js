const { assign } = Object;

export const LOG_LEVELS = {
  NOTHING: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 4,
  DEBUG: 5,
};

export default {
  createLogger: ({ level = LOG_LEVELS.INFO, logCreator } = {}) => {
    let logLevel = evaluateLogLevel(level);
    const logFunction = logCreator(logLevel);

    const createNamespace = (namespace, logLevel = null) => {
      const namespaceLogLevel = evaluateLogLevel(logLevel);
      return createLogFunctions(namespace, namespaceLogLevel);
    };

    const createLogFunctions = (namespace, namespaceLogLevel = null) => {
      const currentLogLevel = () => (namespaceLogLevel === null ? logLevel : namespaceLogLevel);
      const logger = {
        info: createLevel('INFO', LOG_LEVELS.INFO, currentLogLevel, namespace, logFunction),
        error: createLevel('ERROR', LOG_LEVELS.ERROR, currentLogLevel, namespace, logFunction),
        warn: createLevel('WARN', LOG_LEVELS.WARN, currentLogLevel, namespace, logFunction),
        debug: createLevel('DEBUG', LOG_LEVELS.DEBUG, currentLogLevel, namespace, logFunction),
      };

      return assign(logger, {
        namespace: createNamespace,
        setLogLevel: (newLevel) => (logLevel = newLevel),
      });
    };

    return createLogFunctions();
  },
};

const createLevel = (label, level, currentLevel, namespace, logFunction) => (message, extra = {}) => {
  if (level > currentLevel()) {
    return;
  }
  logFunction({
    namespace,
    level,
    label,
    log: assign(
      {
        timestamp: new Date().toISOString(),
        logger: 'ForkQueue',
        message,
      },
      extra,
    ),
  });
};

const evaluateLogLevel = (logLevel) => {
  const envLogLevel = (process.env.KAFKAJS_LOG_LEVEL || '').toUpperCase();
  return LOG_LEVELS[envLogLevel] === null ? logLevel : LOG_LEVELS[envLogLevel];
};
