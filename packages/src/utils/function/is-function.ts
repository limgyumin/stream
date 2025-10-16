import type { AnyFunction } from '../../types';

export const isFunction = <T extends AnyFunction>(
  arg: T | unknown,
): arg is T => {
  return typeof arg === 'function';
};
