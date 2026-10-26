import { defineLazyMethod, defineLazyNamespace } from "../lazy";

type Ns = {
  greet: (name: string) => string;
  ping: () => Promise<string>;
};

const makeNs = (): Ns => ({
  greet: (name) => `hello ${name}`,
  ping: async () => "pong",
});

// Let pending loader promises settle. Jest fails the running test if a
// promise rejection goes unhandled in the meantime.
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("defineLazyNamespace", () => {
  const setup = (loader: () => Promise<Ns>) => {
    const target = {} as { ns: Ns };
    defineLazyNamespace<typeof target, Ns>(target, "ns", loader);
    return target;
  };

  const loaded = async (target: { ns: Ns }) => {
    await target.ns.ping();
    return target.ns;
  };

  it("loads on first read and forwards calls with their arguments", async () => {
    const loader = jest.fn(async () => makeNs());
    const target = setup(loader);

    expect(loader).not.toHaveBeenCalled();
    const ns = target.ns;
    expect(loader).toHaveBeenCalledTimes(1);

    await expect(ns.greet("kit")).resolves.toBe("hello kit");
    await expect(ns.ping()).resolves.toBe("pong");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("does not leave an unhandled rejection when a bare read's load fails", async () => {
    const target = setup(async () => {
      throw new Error("API key required");
    });

    void target.ns;
    await flush();
  });

  it("reports a load failure from the method call that needs the namespace", async () => {
    const target = setup(async () => {
      throw new Error("API key required");
    });

    void target.ns;
    await flush();

    await expect(target.ns.ping()).rejects.toThrow("API key required");
  });

  it("retries the loader after a failed load", async () => {
    const loader = jest
      .fn<Promise<Ns>, []>()
      .mockRejectedValueOnce(new Error("chunk failed to load"))
      .mockResolvedValue(makeNs());
    const target = setup(loader);

    await expect(target.ns.ping()).rejects.toThrow("chunk failed to load");
    await expect(target.ns.ping()).resolves.toBe("pong");
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("is not a thenable, so awaiting it resolves to the namespace", async () => {
    const target = setup(async () => makeNs());

    expect(Reflect.get(target.ns, "then")).toBeUndefined();
    const ns = await target.ns;

    expect(ns).toBe(target.ns);
    await expect(ns.ping()).resolves.toBe("pong");
  });

  it("returns undefined for probes and symbols before it loads", async () => {
    const target = setup(async () => makeNs());

    expect(Reflect.get(target.ns, "toJSON")).toBeUndefined();
    expect(Reflect.get(target.ns, "asymmetricMatch")).toBeUndefined();
    expect(Reflect.get(target.ns, Symbol.iterator)).toBeUndefined();
    expect(JSON.stringify({ ns: target.ns })).toBe('{"ns":{}}');
    await flush();
  });

  it("behaves like the namespace once loaded: keys, `in`, unknown names, JSON", async () => {
    const target = setup(async () => makeNs());
    const ns = await loaded(target);

    expect(Object.keys(ns).sort()).toEqual(["greet", "ping"]);
    expect("greet" in ns).toBe(true);
    expect(Reflect.get(ns, "missing")).toBeUndefined();
    expect(JSON.stringify(ns)).toBe("{}");
  });

  it("keeps the same namespace object and method functions across reads and loads", async () => {
    const target = setup(async () => makeNs());
    const before = target.ns;
    const greet = before.greet;

    await loaded(target);

    expect(target.ns).toBe(before);
    expect(target.ns.greet).toBe(greet);
  });

  it("calls a method synchronously once the namespace has loaded", async () => {
    const target = setup(async () => makeNs());
    const ns = await loaded(target);

    expect(ns.greet("sync")).toBe("hello sync");
  });

  it("keeps a spy set before load, and restores the method afterwards", async () => {
    const target = setup(async () => makeNs());

    const spy = jest.spyOn(target.ns, "ping").mockResolvedValue("spied");
    await expect(target.ns.ping()).resolves.toBe("spied");
    await flush(); // the load completes with the spy in place
    await expect(target.ns.ping()).resolves.toBe("spied");
    expect(spy).toHaveBeenCalledTimes(2);

    spy.mockRestore();
    await expect(target.ns.ping()).resolves.toBe("pong");
    expect("ping" in target.ns).toBe(true);
    expect(Object.keys(target.ns).sort()).toEqual(["greet", "ping"]);
  });

  it("supports a spy set after load", async () => {
    const target = setup(async () => makeNs());
    const ns = await loaded(target);

    const spy = jest.spyOn(ns, "greet").mockReturnValue("spied");
    expect(ns.greet("x")).toBe("spied");

    spy.mockRestore();
    expect(ns.greet("x")).toBe("hello x");
  });

  it("exposes non-function members as their live values once loaded", async () => {
    const state = { ...makeNs(), connected: false };
    const target = {} as { ns: typeof state };
    defineLazyNamespace(target, "ns", async () => state);
    await target.ns.ping();

    expect(target.ns.connected).toBe(false);
    state.connected = true;
    expect(target.ns.connected).toBe(true);
  });

  it("turns a loader's synchronous throw into a rejection on the call", async () => {
    const target = {} as { ns: Ns };
    defineLazyNamespace<typeof target, Ns>(target, "ns", () => {
      throw new Error("sync failure");
    });

    expect(() => target.ns).not.toThrow();
    await expect(target.ns.ping()).rejects.toThrow("sync failure");
  });
});

describe("defineLazyMethod", () => {
  it("loads on first call and caches the implementation", async () => {
    const loader = jest.fn(async () => async (n: number) => n * 2);
    const target = {} as { double: (n: number) => Promise<number> };
    defineLazyMethod(target, "double", loader);

    await expect(target.double(2)).resolves.toBe(4);
    await expect(target.double(3)).resolves.toBe(6);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("retries the loader after a failed load", async () => {
    const loader = jest
      .fn<Promise<(n: number) => Promise<number>>, []>()
      .mockRejectedValueOnce(new Error("chunk failed to load"))
      .mockResolvedValue(async (n) => n * 2);
    const target = {} as { double: (n: number) => Promise<number> };
    defineLazyMethod(target, "double", loader);

    await expect(target.double(2)).rejects.toThrow("chunk failed to load");
    await expect(target.double(2)).resolves.toBe(4);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
