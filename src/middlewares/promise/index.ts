import type {
  WithPromiseBaseOptions,
  WithPromiseOptions,
  WithPromiseReturn,
} from './types';
import type { Stream } from '../../core';

/**
 * @description createStream 인스턴스를 promise 기반으로 변환하는 유틸리티입니다.
 * @example
 * ```tsx
 * const stream = createStream({
 *   url: 'https://example.com/stream',
 *   method: 'POST',
 * });
 *
 * const { promise, abort } = withPromise(stream, {
 *   onMessage: (message) => {
 *     console.log(message);
 *   },
 *   onAbort: () => {
 *     console.log('abort');
 *   }
 * });
 * ```
 */
const withPromise = <T, P = unknown>(
  stream: Stream<T, P>,
  options: WithPromiseOptions<T, P>,
): WithPromiseReturn => {
  let _resolve: () => void;

  const { params, onMessage, onAbort } = options as WithPromiseBaseOptions<
    T,
    P
  >;

  const abort = () => {
    stream.disconnect();
    _resolve?.();
    onAbort?.();
  };

  const promise = new Promise<void>((resolve, reject) => {
    _resolve = resolve;

    stream.addEventListener('message', async (message) => {
      try {
        await onMessage?.(message);
      } catch (error) {
        stream.disconnect();
        reject(error);
      }
    });

    stream.addEventListener('close', () => {
      resolve();
    });

    stream.addEventListener('error', (error) => {
      stream.disconnect();
      reject(error);
    });

    stream.connect(params);
  });

  return {
    promise,
    abort,
  };
};

export default withPromise;
