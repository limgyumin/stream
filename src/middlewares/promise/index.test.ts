import { describe, it, vi, expect } from 'vitest';

import withPromise from '.';
import { createMockStream, mockFetch } from '../../__test__';
import createStream from '../../core';

describe('withPromise', () => {
  it.concurrent('스트리밍을 promise 기반으로 처리할 수 있다.', async () => {
    mockFetch({
      ok: true,
      body: createMockStream([{ event: 'test', data: { text: 'stable 1' } }]),
    });

    const getTestData = createStream({
      url: 'test',
    });

    const onMessage = vi.fn();

    await withPromise(getTestData, undefined, {
      onMessage,
    });

    expect(onMessage).toHaveBeenCalled();
  });

  it.concurrent('HTTP 에러를 처리할 수 있다.', async () => {
    mockFetch({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const getTestData = createStream({
      url: 'test',
    });

    try {
      await withPromise(getTestData);
    } catch (error) {
      expect(error).toEqual(
        new Error('Request failed: 500 Internal Server Error'),
      );
    }
  });

  it.concurrent(
    '스트리밍이 종료되면 마지막으로 수신한 메세지 객체를 반환한다.',
    async () => {
      const chunks = [
        { event: 'test', data: { text: 'stable 1' } },
        { event: 'test', data: { text: 'stable 2' } },
        { event: 'test', data: { text: 'stable 3' } },
      ];

      mockFetch({
        ok: true,
        body: createMockStream(chunks),
      });

      const getTestData = createStream({
        url: 'test',
      });

      const latest = await withPromise(getTestData, undefined);

      expect(latest).toEqual(chunks[chunks.length - 1]);
    },
  );
});
