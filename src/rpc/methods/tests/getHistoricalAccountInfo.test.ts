import type {
  GetHistoricalAccountInfoRequest,
  GetHistoricalAccountInfoResponse,
  HistoricalAccountEncoding,
  HistoricalAccountQuery,
  HistoricalEncodedAccountData,
} from "../../../types/index.js";
import { HeliusRpcError } from "../../caller.js";
import { createHeliusEager as createHelius } from "../../createHelius.eager.js";
import { createHelius as createHeliusLazy } from "../../index.js";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const TOKEN_V1 = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

const respond = (result: unknown) =>
  transportMock.mockResolvedValue({ jsonrpc: "2.0", id: "1", result });
const lastPayload = () => transportMock.mock.lastCall?.[0].payload;

describe("getHistoricalAccountInfo", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("reads an account after a transaction and returns the result as-is", async () => {
    const response: GetHistoricalAccountInfoResponse = {
      context: { slot: 468129571 },
      value: {
        lamports: 531589475273,
        owner: TOKEN_V1,
        data: {
          program: "spl-token",
          parsed: { type: "mint", info: { decimals: 6 } },
          space: 82,
        },
        executable: false,
        rentEpoch: 18446744073709552000,
        space: 82,
        lastUpdatedAt: { slot: 444999837, transactionIndex: 700 },
      },
    };
    respond(response);

    const result = await rpc.getHistoricalAccountInfo([
      USDC,
      { slot: 445000000, transactionIndex: 10 },
      { encoding: "jsonParsed", commitment: "confirmed" },
    ]);

    expect(result).toEqual(response);
    expect(lastPayload()).toMatchObject({
      method: "getHistoricalAccountInfo",
      params: [
        USDC,
        { slot: 445000000, transactionIndex: 10 },
        { encoding: "jsonParsed", commitment: "confirmed" },
      ],
    });
  });

  it("returns a null value when the account didn't exist", async () => {
    respond({ context: { slot: 468129571 }, value: null });

    const result = await rpc.getHistoricalAccountInfo([
      USDC,
      { slot: 445000000 },
    ]);

    expect(result).toEqual({ context: { slot: 468129571 }, value: null });
  });

  it("sends omitted params as empty objects, not null", async () => {
    respond({ context: { slot: 1 }, value: null });

    await rpc.getHistoricalAccountInfo([USDC]);
    expect(lastPayload().params).toEqual([USDC, {}, {}]);

    await rpc.getHistoricalAccountInfo([
      USDC,
      undefined,
      { dataSlice: { offset: 0, length: 8 } },
    ]);
    expect(lastPayload().params).toEqual([
      USDC,
      {},
      { dataSlice: { offset: 0, length: 8 } },
    ]);
    expect(JSON.stringify(lastPayload().params)).not.toContain("null");
  });

  it("throws a HeliusRpcError with the server's code", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32018, message: "Account history not available" },
    });

    const promise = rpc.getHistoricalAccountInfo([USDC, { slot: 400000000 }]);

    await expect(promise).rejects.toBeInstanceOf(HeliusRpcError);
    await expect(promise).rejects.toMatchObject({
      method: "getHistoricalAccountInfo",
      code: -32018,
    });
  });

  it("is available on the lazy client", async () => {
    respond({ context: { slot: 1 }, value: null });

    const helius = createHeliusLazy({ apiKey: "test-key" });
    await helius.getHistoricalAccountInfo([USDC, { slot: 445000000 }]);

    expect(lastPayload()).toMatchObject({
      method: "getHistoricalAccountInfo",
      params: [USDC, { slot: 445000000 }, {}],
    });
  });
});

// Compile-time checks, enforced by `pnpm typecheck` (Jest does not type-check)
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
const assertType = <T extends true>(value: T) => value;

describe("getHistoricalAccountInfo types", () => {
  it("types data as the encoded tuple only for base64 encodings", async () => {
    respond({ context: { slot: 1 }, value: null });
    const helius = createHelius({ apiKey: "test-key" });
    const runtimeEncoding = "base64" as HistoricalAccountEncoding;
    const request: GetHistoricalAccountInfoRequest = [USDC];

    const byDefault = await helius.getHistoricalAccountInfo([USDC]);
    const zstd = await helius.getHistoricalAccountInfo([
      USDC,
      {},
      { encoding: "base64+zstd" },
    ]);
    const parsed = await helius.getHistoricalAccountInfo([
      USDC,
      {},
      { encoding: "jsonParsed" },
    ]);
    const runtime = await helius.getHistoricalAccountInfo([
      USDC,
      {},
      { encoding: runtimeEncoding },
    ]);
    const fromRequest = await helius.getHistoricalAccountInfo(request);

    type Encoded =
      GetHistoricalAccountInfoResponse<HistoricalEncodedAccountData>;
    expect([
      assertType<Equals<typeof byDefault, Encoded>>(true),
      assertType<Equals<typeof zstd, Encoded>>(true),
      assertType<Equals<typeof parsed, GetHistoricalAccountInfoResponse>>(true),
      assertType<Equals<typeof runtime, GetHistoricalAccountInfoResponse>>(
        true
      ),
      assertType<Equals<typeof fromRequest, GetHistoricalAccountInfoResponse>>(
        true
      ),
    ]).not.toContain(false);
    expect([byDefault, zstd, parsed, runtime, fromRequest]).toEqual(
      Array(5).fill({ context: { slot: 1 }, value: null })
    );
  });

  it("requires slot with transactionIndex", () => {
    const maybeSlot = Date.now() < 0 ? 445000000 : undefined;
    const maybeIndex = Date.now() < 0 ? 10 : undefined;

    const latest: HistoricalAccountQuery = {};
    const optionalSlot: HistoricalAccountQuery = { slot: maybeSlot };
    const optionalIndex: HistoricalAccountQuery = {
      slot: 445000000,
      transactionIndex: maybeIndex,
    };
    // @ts-expect-error transactionIndex requires slot
    const indexOnly: HistoricalAccountQuery = { transactionIndex: 10 };
    // @ts-expect-error slot may be undefined
    const indexWithOptionalSlot: HistoricalAccountQuery = {
      slot: maybeSlot,
      transactionIndex: 10,
    };

    expect([
      latest,
      optionalSlot,
      optionalIndex,
      indexOnly,
      indexWithOptionalSlot,
    ]).toHaveLength(5);
  });

  it("rejects encodings and commitments the method doesn't support", () => {
    const base58: GetHistoricalAccountInfoRequest = [
      USDC,
      {},
      // @ts-expect-error base58 isn't supported
      { encoding: "base58" },
    ];
    const processed: GetHistoricalAccountInfoRequest = [
      USDC,
      {},
      // @ts-expect-error processed isn't supported
      { commitment: "processed" },
    ];

    expect([base58, processed]).toHaveLength(2);
  });
});
