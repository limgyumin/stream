import { describe, it, vi, expect } from 'vitest';

import { createEmitter } from '.';

describe('createEmitter', () => {
  it.concurrent('이벤트 리스너를 등록할 수 있다.', () => {
    const event = 'test' as const;
    const listener = vi.fn();

    const emitter = createEmitter<Record<string, undefined>>();

    emitter.on(event, listener);
    emitter.emit(event);

    expect(listener).toHaveBeenCalled();
  });

  it.concurrent('이벤트 리스너를 제거할 수 있다.', () => {
    const event = 'test' as const;
    const listener = vi.fn();

    const emitter = createEmitter<Record<string, undefined>>();

    emitter.on(event, listener);
    emitter.off(event, listener);
    emitter.emit(event);

    expect(listener).not.toHaveBeenCalled();
  });

  it.concurrent('이벤트를 발생시킬 때 매개변수를 전달할 수 있다.', () => {
    const event = 'test' as const;
    const listener = vi.fn();

    const emitter = createEmitter<Record<string, string>>();

    emitter.on(event, listener);
    emitter.emit(event, 'test');

    expect(listener).toHaveBeenCalledWith('test');
  });
});
