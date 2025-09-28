export type AnyFunction = (...args: any[]) => any;

export type Resolvable<T, P> = T | ((params: P) => T);

export type SkipParameters<T extends AnyFunction> =
  [unknown] extends Parameters<T> ? () => ReturnType<T> : T;
