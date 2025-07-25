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
  let loading: Promise<F> | undefined;

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
    loading ??= loader().then(install);
    return loading.then(fn => fn(...args)) as Promise<R>;
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
    A namespace proxy whose methods are lazily executed the first time you call them.
    *I hate TypeScript*
*/
export const defineLazyNamespace = <
  TTarget extends object,
  TNamespace extends object
>(
  target: TTarget,
  key: PropertyKey,
  loader: () => Promise<TNamespace>
): void => {
  let ns: TNamespace | undefined;
  let loading: Promise<TNamespace> | undefined;

  const install = (impl: TNamespace) => {
    ns = impl;
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      writable: false,
      value: impl,
    });
    return impl;
  };

  // A proxy that defers to the resolved namespace methods
  const proxy: TNamespace = new Proxy({} as TNamespace, {
    get(_obj, prop: PropertyKey) {
      // When you call helius.webhooks.someMethod(...),
      // we ensure the namespace is loaded, then forward the call
      return (...args: any[]) => {
        if (ns) {
          return (ns as any)[prop](...args);
        }

        loading ??= loader().then(install);
        return loading.then(impl => (impl as any)[prop](...args));
      };
    },
  });

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      // Kick off loading on first *read*, but immediately return the proxy
      loading ??= loader().then(install);

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
