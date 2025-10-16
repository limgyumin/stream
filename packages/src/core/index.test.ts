import { describe, it, vi, expect } from 'vitest';

import { createStream } from '.';
import { createMockStream, mockFetch } from '../../__test__';

describe('createStream', () => {
  it.concurrent('스트리밍을 처리할 수 있다.', async () => {
    const chunks = [
      { event: 'test', data: { text: 'stable 1' } },
      { event: 'test', data: { text: 'stable 2' } },
      { event: 'test', data: { text: 'stable 3' } },
    ];

    mockFetch({
      ok: true,
      body: createMockStream(chunks),
    });

    const stream = createStream({
      url: 'test',
    });

    const onMessage = vi.fn();

    stream.addEventListener('message', onMessage);

    await stream.connect();

    expect(onMessage).toHaveBeenNthCalledWith(1, chunks[0]);
    expect(onMessage).toHaveBeenNthCalledWith(2, chunks[1]);
    expect(onMessage).toHaveBeenNthCalledWith(3, chunks[2]);
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
    '스트리밍이 종료 되었을 때 작업을 처리할 수 있다.',
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
});
