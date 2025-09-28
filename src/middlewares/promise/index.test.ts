import { describe, it, vi, expect } from 'vitest';

import withPromise from '.';
import { createMockStream, mockAbort, mockFetch } from '../../__test__';
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

    const { promise } = withPromise(getTestData, {
      onMessage,
    });

    await promise;

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

    const { promise } = withPromise(getTestData, {});

    try {
      await promise;
    } catch (error) {
      expect(error).toEqual(
        new Error('Request failed: 500 Internal Server Error'),
      );
    }
  });

  it.concurrent('스트리밍을 종료시킬 수 있다.', async () => {
    mockFetch({
      ok: true,
      body: createMockStream([{ event: 'test', data: { text: 'stable 1' } }]),
    });

    const getTestData = createStream({
      url: 'test',
    });

    const onAbort = vi.fn();

    const { abort } = withPromise(getTestData, {
      onAbort,
    });

    abort();

    expect(mockAbort).toHaveBeenCalled();
    expect(onAbort).toHaveBeenCalled();
  });
});
