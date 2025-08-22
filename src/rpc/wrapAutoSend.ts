import type { PendingRpcRequest, Rpc } from "@solana/kit";

export type AutoSent<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? R extends { send: (...b: any[]) => infer S }
      ? (...args: A) => S extends Promise<infer P> ? Promise<P> : Promise<S>
      : T[K]
    : T[K];
};

const isPending = (x: unknown): x is PendingRpcRequest<any> => {
  return !!x && typeof (x as any).send === "function";
};

export const wrapAutoSend = <T extends Rpc<any>>(raw: T): AutoSent<T> => {
  const added = new Map<string | symbol, any>();

  return new Proxy(raw, {
    get(target, prop, receiver) {
      if (added.has(prop)) return added.get(prop);

      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;

      return (...args: unknown[]) => {
        const result = (value as (...args: unknown[]) => unknown)(...args);
        return isPending(result) ? result.send() : result;
      };
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
