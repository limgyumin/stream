import type { StreamMessage } from '../../core';

export type WithPromiseBaseOptions<T, P> = {
  params: P;
  onMessage?: (message: StreamMessage<T>) => void | Promise<void>;
  onAbort?: () => void;
};

export type WithPromiseOptions<T, P> = unknown extends P
  ? Omit<WithPromiseBaseOptions<T, P>, 'params'>
  : WithPromiseBaseOptions<T, P>;

export type WithPromiseReturn = {
  promise: Promise<void>;
  abort: () => void;
};
