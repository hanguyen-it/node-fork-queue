import { LOG_LEVELS } from './LoggerFactory';

export default () => ({ namespace, level, label, log }) => {
  const prefix = namespace ? `[${namespace}] ` : '';
  const message = `${prefix}${log.message}`;

  switch (level) {
    case LOG_LEVELS.INFO:
      return console.info(message);
    case LOG_LEVELS.ERROR:
      return console.error(message);
    case LOG_LEVELS.WARN:
      return console.warn(message);
    case LOG_LEVELS.DEBUG:
      return console.log(message);
  }
};
