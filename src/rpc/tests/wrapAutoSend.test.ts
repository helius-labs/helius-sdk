import { wrapAutoSend } from "../wrapAutoSend";

describe("wrapAutoSend", () => {
  type FakePending<T> = { send: jest.Mock<Promise<T>, any[]> };

  const makePending = <T>(value: T): FakePending<T> => ({
    send: jest.fn().mockResolvedValue(value),
  });

  const setup = () => {
    const raw = {
      // Returns a non-pending primitive
      getNumber: jest.fn().mockImplementation(() => 42),

      // Returns a non-pending promise
      getAsync: jest.fn().mockImplementation(async (x: number) => x * 2),

      // Returns a pending object that must be auto-sent
      getPending: jest.fn().mockImplementation((msg: string) =>
        makePending(`SENT:${msg}`)
      ),

      // For argument-forwarding checks
      echo: jest.fn().mockImplementation((...args: any[]) => args),

      // Non-function property passthrough
      constant: 7,
    };

    // Cast as any to satisfy <T extends Rpc<any>>
    const wrapped = wrapAutoSend<any>(raw as any);
    return { raw, wrapped };
  };

  it("Passes through non-pending sync results", () => {
    const { raw, wrapped } = setup();
    const res = wrapped.getNumber();

    expect(res).toBe(42);
    expect(raw.getNumber).toHaveBeenCalledTimes(1);
  });

  it("Passes through non-pending async results (promises)", async () => {
    const { raw, wrapped } = setup();
    const res = await wrapped.getAsync(21);

    expect(res).toBe(42);
    expect(raw.getAsync).toHaveBeenCalledWith(21);
  });

  it("Auto-sends when method returns a PendingRpcRequest-like object", async () => {
    const { raw, wrapped } = setup();
    const out = await wrapped.getPending("hello");
    expect(out).toBe("SENT:hello");

    // Ensure original method was invoked and .send() was called once
    expect(raw.getPending).toHaveBeenCalledWith("hello");
    const pendingObj = (raw.getPending.mock.results[0].value as FakePending<string>);
    expect(pendingObj.send).toHaveBeenCalledTimes(1);
  });

  it("Forwards all arguments as is", () => {
    const { raw, wrapped } = setup();
    const args = [1, "two", { three: 3 }];
    const out = wrapped.echo(...args);

    expect(out).toEqual(args);
    expect(raw.echo).toHaveBeenCalledWith(...args);
  });

  it("Exposes non-function properties via the proxy", () => {
    const { wrapped } = setup();
    expect(wrapped.constant).toBe(7);
  });

  it("Supports setting new properties on the proxy (i.e., set/has traps)", () => {
    const { wrapped } = setup();

    // Add a value
    (wrapped as any).newValue = 123;
    expect("newValue" in wrapped).toBe(true);
    expect((wrapped as any).newValue).toBe(123);

    // Add a function and call it
    (wrapped as any).newFn = jest.fn().mockReturnValue("ok");
    expect((wrapped as any).newFn()).toBe("ok");
  });
});
