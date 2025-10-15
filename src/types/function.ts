export type AnyFunction = (...args: any[]) => any;

export type Resolvable<T, P> = T | ((args: P) => T);
