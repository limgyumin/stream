import { describe, it, vi, expect } from 'vitest';

import createStream from '.';
import { createMockStream, mockAbort, mockFetch } from '../__test__';

describe('createStream', () => {
  it.concurrent('스트리밍을 처리할 수 있다.', async () => {
    mockFetch({
      ok: true,
      body: createMockStream([
        { event: 'test', data: { text: 'stable 1' } },
        { event: 'test', data: { text: 'stable 2' } },
        { event: 'test', data: { text: 'stable 3' } },
      ]),
    });

    const stream = createStream({
      url: 'test',
    });

    const onMessage = vi.fn();

    stream.addEventListener('message', onMessage);

    await stream.connect();

    expect(onMessage).toHaveBeenCalledTimes(3);
  });

  it.concurrent('HTTP 에러를 처리할 수 있다.', async () => {
    mockFetch({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const stream = createStream({
      url: 'test',
    });

    const onError = vi.fn();

    stream.addEventListener('error', onError);

    await stream.connect();

    expect(onError).toHaveBeenCalled();
  });

  it.concurrent(
    '스트리밍이 종료된 후 수행할 작업을 처리할 수 있다.',
    async () => {
      mockFetch({
        ok: true,
        body: createMockStream([{ event: 'test', data: { text: 'stable 1' } }]),
      });

      const stream = createStream({
        url: 'test',
      });

      const onClose = vi.fn();

      stream.addEventListener('close', onClose);

      await stream.connect();

      expect(onClose).toHaveBeenCalled();
    },
  );

  it.concurrent('스트리밍을 강제 종료시킬 수 있다.', () => {
    mockFetch({
      ok: true,
      body: createMockStream([{ event: 'test', data: { text: 'stable 1' } }]),
    });

    const stream = createStream({
      url: 'test',
    });

    const onClose = vi.fn();

    stream.addEventListener('close', onClose);

    stream.connect();

    stream.disconnect();

    expect(mockAbort).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
