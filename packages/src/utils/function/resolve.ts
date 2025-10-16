import { isFunction } from './is-function';

export const resolve = <T, P>(value: T | ((args: P) => T), args: P): T => {
  return isFunction(value) ? value(args) : value;
};
