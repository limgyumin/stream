import { vi } from 'vitest';

export const createMockStream = (chunks: any[]) => {
  let i = 0;

  const mockRead = vi.fn().mockImplementation(() => {
    return new Promise((resolve) => {
      if (i < chunks.length) {
        resolve({ value: chunks[i++], done: false });
      } else {
        resolve({ done: true });
      }
    });
  });

  const mockStream = {
    getReader: () => ({
      read: mockRead,
      releaseLock: vi.fn(),
    }),
    pipeThrough: () => mockStream,
  };

  return mockStream;
};

type MockResponse =
  | {
      ok: true;
      body: ReturnType<typeof createMockStream>;
    }
  | {
      ok: false;
      status: number;
      statusText: string;
    };

export const mockFetch = (response: MockResponse) => {
  global.fetch = vi.fn().mockResolvedValue(response);
};

export const mockAbort = vi.fn();

global.AbortController = vi.fn().mockImplementation(() => ({
  abort: mockAbort,
}));

global.TextDecoderStream = vi.fn();

global.TransformStream = vi.fn();
