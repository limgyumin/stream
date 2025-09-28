import { fetchImpl, type RequestConfig } from './fetch';
import type { Overwrite, Resolvable, SkipParameters } from '../types';
import { createSSEJsonParser } from './parsers/json';
import { createEmitter, type Emitter } from '../utils/emitter';
import { resolve } from '../utils/function';
import { readStream } from '../utils/stream';

export type StreamRequestConfig<P> = Overwrite<
  RequestConfig,
  {
    /**
     * @description 요청을 보낼 URL 로, 외부 파라미터를 받는 경우 함수로 정의할 수 있습니다.
     */
    url: Resolvable<RequestConfig['url'], P>;

    /**
     * @description URL 에 포함할 query parameter 로, 외부 파라미터를 받는 경우 함수로 정의할 수 있습니다.
     */
    query?: Resolvable<RequestConfig['query'], P>;

    /**
     * @description 요청에 포함될 부가 데이터로, 외부 파라미터를 받는 경우 함수로 정의할 수 있습니다.
     */
    body?: Resolvable<RequestConfig['body'], P>;
  }
>;

export type StreamMessage<T = any> = {
  event?: string;
  retry?: number;
  id?: string;
  data: T;
};

export type StreamEvents<T> = {
  message: StreamMessage<T>;
  error: Error;
  close: undefined;
};

export type Stream<T, P = unknown> = {
  /**
   * @description 스트림을 연결하는 함수입니다.
   */
  connect: SkipParameters<(params: P) => Promise<void>>;

  /**
   * @description 스트림을 강제 종료하는 함수입니다.
   */
  disconnect: () => void;

  /**
   * @description 스트림 생명주기 기반의 이벤트 리스너를 등록하는 함수입니다.
   */
  addEventListener: Emitter<StreamEvents<T>>['on'];

  /**
   * @description 스트림 생명주기 기반의 이벤트 리스너를 제거하는 함수입니다.
   */
  removeEventListener: Emitter<StreamEvents<T>>['off'];
};

/**
 * @description SSE 기반의 스트리밍을 처리하는 유틸리티입니다.
 * @example
 * ```tsx
 * const stream = createStream({
 *   url: 'https://example.com/stream',
 *   method: 'POST',
 * });
 *
 * stream.addEventListener('message', message => {
 *   console.log(message);
 * });
 *
 * stream.addEventListener('error', error => {
 *   console.error(error);
 * });
 *
 * stream.connect(params);
 * ```
 */
const createStream = <T, P = unknown>(
  config: StreamRequestConfig<P>,
): Stream<T, P> => {
  const emitter = createEmitter<StreamEvents<T>>();
  const parse = createSSEJsonParser();

  let abortController: AbortController | undefined;

  const clear = () => {
    abortController = undefined;
    emitter.clear();
  };

  const connect = async (params: P = {} as P): Promise<void> => {
    abortController = new AbortController();

    try {
      const response = await fetchImpl({
        ...config,
        url: resolve(config.url, params),
        query: resolve(config.query, params),
        body: resolve(config.body, params),
        signal: abortController.signal,
      });

      if (!response.body) {
        throw new Error('No response body.');
      }

      const stream = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(
          /**
           * NOTE:
           * 문자열로 디코딩된 청크를 SSE 원본 응답 형태에 맞는 JSON 으로 파싱하고, 개별 응답으로 읽을 수 있도록 큐에 추가한다.
           */
          new TransformStream<string, StreamMessage<T>>({
            transform: (chunk, controller) => {
              const messages = parse(chunk);

              for (const message of messages) {
                controller.enqueue(message);
              }
            },
          }),
        );

      const chunks = readStream(stream);

      for await (const chunk of chunks) {
        emitter.emit('message', chunk);
      }
    } catch (error) {
      emitter.emit('error', error as Error);
    } finally {
      emitter.emit('close');
      clear();
    }
  };

  const disconnect = () => {
    abortController?.abort();
    emitter.emit('close');
    clear();
  };

  return {
    connect,
    disconnect,
    addEventListener: emitter.on,
    removeEventListener: emitter.off,
  };
};

export default createStream;
