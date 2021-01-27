import CustomError from '../models/CustomError';
import { ERR_TIMED_OUT } from '../models/CustomError';

export default {
  /**
   * Timeout a promise after certain amount of time, in order to avoid hanging forever
   * Note: the promise does not stop after timeout because Promises represent the result of an asynchronous task, they don't know about the task itself and thus cannot cancel it.
   *
   * @param {*} promiseFunc required
   * @param {*} timeoutMs required
   * @param {*} error optional
   */
  promiseWithTimeout: async (promiseFunc, timeoutMs, error) => {
    let timer;
    const timeoutErr = error || new CustomError(ERR_TIMED_OUT, `Timed out after ${timeoutMs} milliseconds.`);

    const timeoutPromise = new Promise((resolve, reject) => {
      timer = setTimeout(reject, timeoutMs, timeoutErr);
    });

    const rs = await Promise.race([promiseFunc, timeoutPromise]);

    clearTimeout(timer);
    return rs;
  },
};
