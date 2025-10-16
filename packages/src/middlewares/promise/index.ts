import type { ConnectOptions, Stream, StreamMessage } from '../../core';

export type WithPromiseFunction = {
  <T>(
    stream: Stream<T, void>,
    variables: void,
    options?: WithPromiseOptions<T>,
  ): Promise<StreamMessage<T> | undefined>;
  <T, V>(
    stream: Stream<T, V>,
    variables: V,
    options?: WithPromiseOptions<T>,
  ): Promise<StreamMessage<T> | undefined>;
};

export type WithPromiseOptions<T> = ConnectOptions & {
  onMessage?: (message: StreamMessage<T>) => void | Promise<void>;
};

/**
 * @description createStream 인스턴스를 promise 기반으로 변환하는 유틸리티입니다.
 * @example
 * ```tsx
 * const stream = createStream({
 *   url: 'https://example.com/stream',
 *   method: 'POST',
 * });
 *
 * try {
 *   const latestMessage = await withPromise(stream, undefined, {
 *     onMessage: (message) => {
 *       console.log(message);
 *     },
 *   });
 * } catch (error) {
 *   console.error(error);
 * }
 * ```
 */
export const withPromise: WithPromiseFunction = <T, V = void>(
  stream: Stream<T, V>,
  variables: V,
  options?: WithPromiseOptions<T>,
) => {
  const { signal, onMessage } = options ?? {};

  return new Promise<StreamMessage<T> | undefined>((resolve, reject) => {
    let latestMessage: StreamMessage<T> | undefined;

    const handleMessage = async (message: StreamMessage<T>) => {
      latestMessage = message;

      try {
        await onMessage?.(message);
      } catch (error) {
        reject(error);
      }
    };

    const handleError = (error: Error) => {
      reject(error);
    };

    const handleClose = () => {
      resolve(latestMessage);
    };

    stream.addEventListener('message', handleMessage);
    stream.addEventListener('error', handleError);
    stream.addEventListener('close', handleClose);

    stream
      .connect(variables, {
        signal,
      })
      .finally(() => {
        stream.removeEventListener('message', handleMessage);
        stream.removeEventListener('error', handleError);
        stream.removeEventListener('close', handleClose);
      });
  });
};
