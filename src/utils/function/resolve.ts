import { isFunction } from './is-function';

export const resolve = <T, P>(value: T | ((params: P) => T), params: P): T => {
  return isFunction(value) ? value(params) : value;
};
