export type Listener<T> = (args: T) => void;

export type EventType = Record<string | symbol, unknown>;

export type Events<E extends EventType> = Map<
  keyof E,
  Set<Listener<E[keyof E]>>
>;

export type Emitter<E extends EventType> = {
  on: <K extends keyof E>(type: K, listener: Listener<E[K]>) => void;
  off: <K extends keyof E>(type: K, listener: Listener<E[K]>) => void;
  emit: <K extends keyof E>(
    type: K,
    ...args: E[K] extends undefined ? [] : [E[K]]
  ) => void;
  clear: () => void;
};

export const createEmitter = <E extends EventType>(): Emitter<E> => {
  const events: Events<E> = new Map();

  return {
    on: <K extends keyof E>(type: K, listener: Listener<E[K]>) => {
      if (!events.has(type)) {
        events.set(type, new Set());
      }

      const event = events.get(type);

      event?.add(listener as Listener<E[keyof E]>);
    },
    off: <K extends keyof E>(type: K, listener: Listener<E[K]>) => {
      const existing = events.get(type);

      if (!existing) {
        return;
      }

      existing.delete(listener as Listener<E[keyof E]>);

      if (existing.size === 0) {
        events.delete(type);
      }
    },
    emit: <K extends keyof E>(
      type: K,
      ...args: E[K] extends undefined ? [] : [E[K]]
    ) => {
      const event = events.get(type);

      event?.forEach((listener) => listener(...(args as [E[K]])));
    },
    clear: () => {
      events.clear();
    },
  };
};
