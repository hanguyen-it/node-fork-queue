export const ERR_TIMED_OUT = 'ERR_TIMED_OUT';
export const ERR_UNEXPECTEDLY_EXITED = 'ERR_UNEXPECTEDLY_EXITED';

export default class CustomError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
