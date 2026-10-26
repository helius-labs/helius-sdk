import { address, fetchEncodedAccount, type RpcTransport } from "@solana/kit";
import { createHelius } from "../index";
import { createHeliusEager } from "../createHelius.eager";

// Uses the real @solana/kit; only the network is replaced, via the transport hook
const ACCOUNT = address("So11111111111111111111111111111111111111112");
const OWNER = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

const results: Record<string, unknown> = {
  getSlot: 123,
  getAccountInfo: {
    context: { slot: 123 },
    value: {
      data: ["AQID", "base64"],
      executable: false,
      lamports: 1_000_000,
      owner: OWNER,
      rentEpoch: 0,
      space: 3,
    },
  },
};

const makeTransport = () =>
  jest.fn(async ({ payload }: { payload: unknown }) => {
    const { method, id } = payload as { method: string; id: string };
    return { jsonrpc: "2.0", id, result: results[method] };
  });

const clients = [
  ["createHelius", createHelius],
  ["createHeliusEager", createHeliusEager],
] as const;

describe.each(clients)("%s kitRpc and raw", (_name, create) => {
  let transport: ReturnType<typeof makeTransport>;
  let helius: ReturnType<typeof create>;

  beforeEach(() => {
    transport = makeTransport();
    helius = create({
      apiKey: "test-api-key",
      transport: () => transport as unknown as RpcTransport,
    });
  });

  it("exposes kitRpc as a kit Rpc whose methods return pending requests", async () => {
    const pending = helius.kitRpc.getSlot();

    expect(typeof pending.send).toBe("function");
    expect(transport).not.toHaveBeenCalled();
    await expect(pending.send()).resolves.toBe(123n);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("keeps raw as the auto-sending client", async () => {
    await expect(helius.raw.getSlot()).resolves.toBe(123n);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("works with @solana/kit helpers that take an Rpc", async () => {
    const account = await fetchEncodedAccount(helius.kitRpc, ACCOUNT);

    expect(account).toMatchObject({
      exists: true,
      address: ACCOUNT,
      lamports: 1_000_000n,
      programAddress: OWNER,
      data: new Uint8Array([1, 2, 3]),
    });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0].payload).toMatchObject({
      method: "getAccountInfo",
      params: [ACCOUNT, { encoding: "base64" }],
    });
  });

  it("sends the request, then fails, when raw is passed as a kit Rpc", async () => {
    await expect(
      // @ts-expect-error raw auto-sends, so it is not a kit Rpc
      fetchEncodedAccount(helius.raw, ACCOUNT)
    ).rejects.toThrow(TypeError);
    // The auto-send wrapper fires the request before the helper calls .send()
    expect(transport).toHaveBeenCalledTimes(1);
  });
});

describe.each(clients)(
  "%s kitRpc without a transport hook",
  (_name, create) => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(
          async () =>
            new Response(
              JSON.stringify({ jsonrpc: "2.0", id: "helius-sdk", result: 7 }),
              { headers: { "content-type": "application/json" } }
            )
        );
    });

    afterEach(() => fetchSpy.mockRestore());

    it("uses the SDK's default transport: Helius URL, API key, SDK headers, request id", async () => {
      const helius = create({ apiKey: "test-api-key" });

      await expect(helius.kitRpc.getSlot().send()).resolves.toBe(7n);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toBe(
        "https://mainnet.helius-rpc.com/?api-key=test-api-key"
      );
      expect(new Headers(init.headers).get("user-agent")).toMatch(
        /^helius-node-sdk\//
      );
      expect(JSON.parse(init.body)).toMatchObject({
        id: "helius-sdk",
        method: "getSlot",
      });
    });
  }
);

describe("createHelius kitRpc on the proxied client", () => {
  const helius = createHelius({
    apiKey: "test-api-key",
    transport: () => makeTransport() as unknown as RpcTransport,
  });

  it("is an own property, not resolved through the standard-method proxy", () => {
    const descriptor = Reflect.getOwnPropertyDescriptor(helius, "kitRpc");

    expect(descriptor?.value).toBe(helius.kitRpc);
    expect(helius.kitRpc).not.toBe(helius.raw);
  });

  it("keeps v1-style helius.rpc.<method> calls failing loudly", () => {
    // v1 exposed DAS and transaction helpers on helius.rpc; v2 has no such property
    const v1Rpc = Reflect.get(helius, "rpc");

    expect(() => v1Rpc.getAssetsByOwner({ ownerAddress: "owner" })).toThrow(
      TypeError
    );
  });
});
