export type AnyObject = Record<PropertyKey, any>;

export type Overwrite<T, U> = Omit<T, keyof U> & U;
