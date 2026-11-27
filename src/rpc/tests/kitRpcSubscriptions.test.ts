import {
  airdropFactory,
  createSolanaRpcSubscriptions,
  sendAndConfirmTransactionFactory,
  type RpcTransport,
} from "@solana/kit";
import { makeTxHelpersLazy } from "../../transactions/index.js";
import { createHelius } from "../index.js";

// Real kit; the spy only records how the subscriptions client is created.
// Kit opens no socket until something subscribes.
jest.mock("@solana/kit", () => {
  const actual = jest.requireActual("@solana/kit");
  return {
    ...actual,
    createSolanaRpcSubscriptions: jest.fn(actual.createSolanaRpcSubscriptions),
  };
});

jest.mock("../../transactions/index.js", () => ({
  makeTxHelpersLazy: jest.fn(() => ({ sendSmartTransaction: jest.fn() })),
}));

const createSubs = createSolanaRpcSubscriptions as jest.MockedFunction<
  typeof createSolanaRpcSubscriptions
>;
const txHelpers = makeTxHelpersLazy as jest.MockedFunction<
  typeof makeTxHelpersLazy
>;

describe("createHelius getKitRpcSubscriptions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns a kit RpcSubscriptions on the client's WebSocket URL", async () => {
    const helius = createHelius({ apiKey: "k", network: "devnet" });

    const subs = await helius.getKitRpcSubscriptions();

    expect(typeof subs.signatureNotifications).toBe("function");
    expect(createSubs).toHaveBeenCalledWith(
      "wss://devnet.helius-rpc.com/?api-key=k"
    );
  });

  it("leaves mev-protect out of the WebSocket URL", async () => {
    const helius = createHelius({ apiKey: "k", mevProtect: true });

    await helius.getKitRpcSubscriptions();

    expect(createSubs).toHaveBeenCalledWith(
      "wss://mainnet.helius-rpc.com/?api-key=k"
    );
  });

  it("creates the client once, even for concurrent first calls", async () => {
    const helius = createHelius({ apiKey: "k" });

    const [a, b] = await Promise.all([
      helius.getKitRpcSubscriptions(),
      helius.getKitRpcSubscriptions(),
    ]);
    const c = await helius.getKitRpcSubscriptions();

    expect(a).toBe(b);
    expect(a).toBe(c);
    expect(createSubs).toHaveBeenCalledTimes(1);
  });

  it("shares the client with the transaction helpers", async () => {
    const helius = createHelius({ apiKey: "k" });

    const subs = await helius.getKitRpcSubscriptions();
    await helius.tx.sendSmartTransaction(
      {} as Parameters<typeof helius.tx.sendSmartTransaction>[0]
    );

    expect(txHelpers.mock.calls[0][2]).toBe(subs);
    expect(createSubs).toHaveBeenCalledTimes(1);
  });

  it("is accepted by kit helpers that need rpc + rpcSubscriptions", async () => {
    const helius = createHelius({ apiKey: "k", network: "devnet" });
    const rpcSubscriptions = await helius.getKitRpcSubscriptions();

    // Type-checked by `pnpm typecheck`; the factories open no connections
    expect(
      typeof sendAndConfirmTransactionFactory({
        rpc: helius.kitRpc,
        rpcSubscriptions,
      })
    ).toBe("function");
    expect(
      typeof airdropFactory({ rpc: helius.kitRpc, rpcSubscriptions })
    ).toBe("function");
  });

  it("retries after a failed first creation instead of caching the error", async () => {
    createSubs.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const helius = createHelius({ apiKey: "k" });

    await expect(helius.getKitRpcSubscriptions()).rejects.toThrow("boom");
    const subs = await helius.getKitRpcSubscriptions();

    expect(typeof subs.signatureNotifications).toBe("function");
    expect(createSubs).toHaveBeenCalledTimes(2);
  });

  it("gives each client its own subscriptions client", async () => {
    const a = await createHelius({ apiKey: "a" }).getKitRpcSubscriptions();
    const b = await createHelius({ apiKey: "b" }).getKitRpcSubscriptions();

    expect(a).not.toBe(b);
  });
});

describe("createHelius airdrop", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects on mainnet before creating subscriptions", async () => {
    const helius = createHelius({ apiKey: "k" });

    await expect(
      helius.airdrop("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin", 1n)
    ).rejects.toThrow("airdrop is devnet-only");
    expect(createSubs).not.toHaveBeenCalled();
  });

  it("allows a non-Helius baseUrl", async () => {
    const transport = jest.fn(
      async ({ payload }: { payload: { id: string } }) => ({
        jsonrpc: "2.0",
        id: payload.id,
        error: { code: -32000, message: "faucet empty" },
      })
    );
    const helius = createHelius({
      baseUrl: "http://127.0.0.1:8899",
      transport: () => transport as unknown as RpcTransport,
    });

    // Rejects with the RPC error, after the request went out
    await expect(
      helius.airdrop("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin", 1n)
    ).rejects.not.toThrow("airdrop is devnet-only");
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0].payload).toMatchObject({
      method: "requestAirdrop",
      params: [
        "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
        1,
        { commitment: "confirmed" },
      ],
    });
  });

  it("treats a mainnet Helius baseUrl as mainnet", async () => {
    const helius = createHelius({
      apiKey: "k",
      baseUrl: "https://mainnet.helius-rpc.com",
    });

    await expect(
      helius.airdrop("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin", 1n)
    ).rejects.toThrow("airdrop is devnet-only");
  });
});
