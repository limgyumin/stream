import { safeFetch, type RequestConfig } from './fetch';
import { createJsonParser } from './parsers/json';
import { readStream } from '../utils/stream';

export type Stream<T = unknown> = {
  event?: string;
  retry?: number;
  id?: string;
  data: T;
};

export type StreamOptions = {
  /**
   * Abort signal that can be used to abort the stream.
   *
   * @example
   * ```ts
   * const chunks = stream(config, {
   *   signal: AbortSignal.timeout(1000 * 10),
   * });
   * ```
   */
  signal?: AbortSignal;

  /**
   * Callback that is called when an error occurs during streaming.
   *
   * @example
   * ```ts
   * const chunks = stream(config, {
   *   onError: (error) => {
   *     console.error(error);
   *   },
   * });
   * ```
   */
  onError?: (error: Error) => void;

  /**
   * Callback that is called when streaming is finished.
   *
   * @example
   * ```ts
   * const chunks = stream(config, {
   *   onFinish: () => {
   *     console.log('finished');
   *   },
   * });
   * ```
   */
  onFinish?: () => void;
};

declare const dataSymbol: unique symbol;

export type StreamConfig<T> = RequestConfig & {
  [dataSymbol]?: T;
};

/**
 * Allows you to share and reuse stream config in a type-safe way.
 *
 * @example
 * ```ts
 * const config = streamConfig({
 *   url: 'https://example.com/stream',
 * });
 *
 * const chunks = stream(config);
 * ```
 */
export const streamConfig = <T>(config: StreamConfig<T>): StreamConfig<T> => {
  return config;
};

/**
 * Streams the output received from the source.
 *
 * This function starts streaming immediately upon being called and does not throw any errors that occur during the process.
 * To handle errors, use the onError callback.
 *
 * @example
 * ```ts
 * const chunks = stream({
 *   url: 'https://example.com/stream',
 * });
 *
 * for await (const chunk of chunks) {
 *   console.log(chunk.data);
 * }
 * ```
 */
export async function* stream<T>(
  config: StreamConfig<T>,
  options?: StreamOptions,
): AsyncGenerator<Stream<T>> {
  const { signal, onError, onFinish } = options ?? {};

  try {
    const response = await safeFetch({ ...config, signal });

    if (!response.body) {
      throw new Error('No response body.');
    }

    const parse = createJsonParser();

    const piped = response.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(
        new TransformStream<string, Stream<T>>({
          /**
           * Decode the chunks as strings, parse them into JSON matching the original response format,
           * and enqueue them so they can be read as individual responses.
           */
          transform: (chunks, controller) => {
            for (const chunk of parse(chunks)) {
              controller.enqueue(chunk);
            }
          },
        }),
      );

    yield* readStream(piped);
  } catch (error) {
    onError?.(error as Error);
  } finally {
    onFinish?.();
  }
}
