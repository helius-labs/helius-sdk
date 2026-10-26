/*
    Memoizes an async loader. A failed load is cleared so the next call
    retries instead of rejecting with the same error forever. The loader still
    starts synchronously, and a synchronous throw becomes a rejection.
*/
const memoizeLoader = <T>(loader: () => Promise<T>) => {
  let loading: Promise<T> | undefined;
  return () =>
    (loading ??= new Promise<T>((resolve) => resolve(loader())).catch((err) => {
      loading = undefined;
      throw err;
    }));
};

/*
    A helper to define a lazily-loaded method.
    It returns a function that, on the first call, imports the real implementation
    and then caches it for all subsequent calls
*/
export const defineLazyMethod = <
  T extends object,
  F extends (...args: any[]) => any,
>(
  target: T,
  key: PropertyKey,
  loader: () => Promise<F>
): void => {
  type R = Awaited<ReturnType<F>>;

  let impl: F | undefined;

  const install = (fn: F) => {
    impl = fn;

    // Replace the property with the resolved function so we skip the getter forever after
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      writable: false,
      value: fn,
    });

    return fn;
  };

  const load = memoizeLoader(() => loader().then(install));

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      // The first time someone *reads* the property, we return a callable proxy
      const proxy = (...args: Parameters<F>): Promise<R> => {
        if (impl) {
          // Wrap in Promise.resolve to normalize sync/async F
          return Promise.resolve(impl(...args)) as Promise<R>;
        }
        return load().then((fn) => fn(...args)) as Promise<R>;
      };

      // Replace the getter with the proxy immediately, so future reads don't hit this getter again
      Object.defineProperty(target, key, {
        configurable: true,
        enumerable: true,
        writable: false,
        value: proxy,
      });

      return proxy;
    },
  });
};

/*
    A lazily-loaded namespace: one stable object that forwards calls to the
    implementation. Once loaded it holds a forwarder per method, so keys, `in`,
    and spies work like the real namespace.
    *I hate TypeScript*
*/
export const defineLazyNamespace = <
  TTarget extends object,
  TNamespace extends object,
>(
  target: TTarget,
  key: PropertyKey,
  loader: () => Promise<TNamespace>
): void => {
  let ns: TNamespace | undefined;
  const shell: Record<PropertyKey, unknown> = {};

  // Cached so repeated reads return the same function
  const forwarders = new Map<PropertyKey, (...args: unknown[]) => unknown>();
  const forwarder = (prop: PropertyKey) => {
    let forward = forwarders.get(prop);
    if (!forward) {
      forward = (...args) =>
        ns
          ? (ns as any)[prop](...args)
          : load().then((impl) => (impl as any)[prop](...args));
      forwarders.set(prop, forward);
    }
    return forward;
  };

  // Give the shell a forwarder for a loaded method
  const attach = (prop: PropertyKey) => {
    if (typeof Reflect.get(ns!, prop) === "function") {
      shell[prop] = forwarder(prop);
    }
  };

  const load = memoizeLoader(() =>
    loader().then((impl) => {
      ns = impl;
      // Keep values already assigned, e.g. by jest.spyOn
      for (const name of Object.keys(impl)) {
        if (!Object.prototype.hasOwnProperty.call(shell, name)) attach(name);
      }
      return impl;
    })
  );

  const proxy = new Proxy(shell, {
    get(shell, prop) {
      if (prop in shell) return Reflect.get(shell, prop);
      // Loaded: non-methods read live; unknown names are undefined
      if (ns) return prop in ns ? Reflect.get(ns, prop) : undefined;
      // Not loaded: `then` (so `await` gets the namespace), probes, and
      // symbols aren't methods
      return typeof prop === "symbol" ||
        ["then", "toJSON", "asymmetricMatch"].includes(prop)
        ? undefined
        : forwarder(prop);
    },
    // A spy's restore deletes the method; put its forwarder back
    deleteProperty(shell, prop) {
      delete shell[prop];
      if (ns) attach(prop);
      return true;
    },
  }) as TNamespace;

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      // Start loading on first *read*; failures surface on method calls
      load().catch(() => {});

      // Replace this getter so we don't run it again
      Object.defineProperty(target, key, {
        configurable: true,
        enumerable: true,
        writable: false,
        value: proxy,
      });
      return proxy;
    },
  });
};
