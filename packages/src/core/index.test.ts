import { describe, it, vi, expect } from 'vitest';

import { stream } from '.';
import { createMockStream, mockFetch } from '../../__test__';

describe('stream', () => {
  it.concurrent('can handle streaming.', async () => {
    const mockChunks = [
      { event: 'test', data: { text: 'stable 1' } },
      { event: 'test', data: { text: 'stable 2' } },
      { event: 'test', data: { text: 'stable 3' } },
    ];

    mockFetch({
      ok: true,
      body: createMockStream(mockChunks),
    });

    const chunks = stream({
      url: 'test',
    });

    let index = 0;

    for await (const chunk of chunks) {
      expect(chunk).toEqual(mockChunks[index]);
      index++;
    }

    expect(index).toBe(mockChunks.length);
  });

  it.concurrent('can handle occurred errors while streaming.', async () => {
    mockFetch({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const onError = vi.fn();

    const chunks = stream({ url: 'test' }, { onError });

    for await (const _ of chunks) {
      // do nothing
    }

    expect(onError).toHaveBeenCalled();
  });

  it.concurrent('can handle streaming when it is finished.', async () => {
    mockFetch({
      ok: true,
      body: createMockStream([{ event: 'test', data: { text: 'stable 1' } }]),
    });

    const onFinish = vi.fn();

    const chunks = stream({ url: 'test' }, { onFinish });

    for await (const _ of chunks) {
      // do nothing
    }

    expect(onFinish).toHaveBeenCalled();
  });
});
