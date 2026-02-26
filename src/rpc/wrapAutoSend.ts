/**
 * Transforms an RPC client so every method that returns a pending request
 * (i.e. an object with a `.send()` method) is automatically sent, returning
 * a `Promise` directly instead.
 */
export type AutoSent<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? R extends { send: (...b: any[]) => infer S }
      ? (...args: A) => S extends Promise<infer P> ? Promise<P> : Promise<S>
      : T[K]
    : T[K];
};

/** Duck-type guard: anything with a `.send()` function is treated as a pending RPC request */
const isPending = (x: unknown): x is { send: () => unknown } => {
  return !!x && typeof (x as any).send === "function";
};

export const wrapAutoSend = <T extends object>(raw: T): AutoSent<T> => {
  const added = new Map<string | symbol, any>();

  return new Proxy(raw, {
    get(target, prop, receiver) {
      if (added.has(prop)) return added.get(prop);

      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;

      const wrapper = function (this: any, ...args: any[]) {
        const result = value.apply(this, args);
        return isPending(result) ? result.send() : result;
      };

      return wrapper as AutoSent<T>[keyof T];
    },

    set(_target, prop, value) {
      added.set(prop, value);
      return true;
    },

    has(target, prop) {
      return added.has(prop) || Reflect.has(target, prop);
    },
  }) as AutoSent<T>;
};
