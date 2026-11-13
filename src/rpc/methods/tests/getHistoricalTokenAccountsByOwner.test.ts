import type {
  GetHistoricalTokenAccountsByOwnerConfig,
  GetHistoricalTokenAccountsByOwnerRequest,
  GetHistoricalTokenAccountsByOwnerResponse,
  HistoricalEncodedAccountData,
  HistoricalKeyedAccount,
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

const OWNER = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const TOKEN_V1 = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

const tokenAccount = (pubkey: string): HistoricalKeyedAccount => ({
  pubkey,
  account: {
    lamports: 2039280,
    owner: TOKEN_V1,
    data: {
      program: "spl-token",
      parsed: {
        type: "account",
        info: { mint: USDC, owner: OWNER, tokenAmount: { amount: "1" } },
      },
      space: 165,
    },
    executable: false,
    rentEpoch: 18446744073709552000,
    space: 165,
    lastUpdatedAt: { slot: 444959999, transactionIndex: null },
  },
});

const page = (
  accounts: HistoricalKeyedAccount[],
  paginationKey: string | null
): GetHistoricalTokenAccountsByOwnerResponse => ({
  context: { slot: 468129571 },
  value: { accounts, paginationKey },
});

const respondOnce = (result: unknown) =>
  transportMock.mockResolvedValueOnce({ jsonrpc: "2.0", id: "1", result });
const payload = (call: number) => transportMock.mock.calls[call][0].payload;

describe("getHistoricalTokenAccountsByOwner", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("fetches a page for a mint and returns the result as-is", async () => {
    const response = page([tokenAccount("A")], `${USDC}:A`);
    respondOnce(response);

    const result = await rpc.getHistoricalTokenAccountsByOwner([
      OWNER,
      { slot: 445000000 },
      { mint: USDC, encoding: "jsonParsed", limit: 1 },
    ]);

    expect(result).toEqual(response);
    expect(payload(0)).toMatchObject({
      method: "getHistoricalTokenAccountsByOwner",
      params: [
        OWNER,
        { slot: 445000000 },
        { mint: USDC, encoding: "jsonParsed", limit: 1 },
      ],
    });
  });

  it("pages through short and empty pages until paginationKey is null", async () => {
    respondOnce(page([tokenAccount("A")], "k1"));
    respondOnce(page([], "k2"));
    respondOnce(page([tokenAccount("B")], null));

    const query = { slot: 445000000 };
    const pubkeys: string[] = [];
    let paginationKey: string | undefined;
    do {
      const { value } = await rpc.getHistoricalTokenAccountsByOwner([
        OWNER,
        query,
        { programId: TOKEN_2022, paginationKey },
      ]);
      pubkeys.push(...value.accounts.map((a) => a.pubkey));
      paginationKey = value.paginationKey ?? undefined;
    } while (paginationKey);

    expect(pubkeys).toEqual(["A", "B"]);
    expect(transportMock.mock.calls.map((_, i) => payload(i).params)).toEqual([
      [OWNER, query, { programId: TOKEN_2022 }],
      [OWNER, query, { programId: TOKEN_2022, paginationKey: "k1" }],
      [OWNER, query, { programId: TOKEN_2022, paginationKey: "k2" }],
    ]);
  });

  it("sends omitted params as empty objects, not null", async () => {
    respondOnce(page([], null));
    respondOnce(page([], null));

    await rpc.getHistoricalTokenAccountsByOwner([OWNER]);
    await rpc.getHistoricalTokenAccountsByOwner([
      OWNER,
      undefined,
      { programId: TOKEN_V1 },
    ]);

    expect(payload(0).params).toEqual([OWNER, {}, {}]);
    expect(payload(1).params).toEqual([OWNER, {}, { programId: TOKEN_V1 }]);
  });

  it("throws a HeliusRpcError with the server's code", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    const promise = rpc.getHistoricalTokenAccountsByOwner([
      OWNER,
      {},
      { limit: 0 },
    ]);

    await expect(promise).rejects.toBeInstanceOf(HeliusRpcError);
    await expect(promise).rejects.toMatchObject({
      method: "getHistoricalTokenAccountsByOwner",
      code: -32602,
    });
  });

  it("is available on the lazy client", async () => {
    respondOnce(page([], null));

    const helius = createHeliusLazy({ apiKey: "test-key" });
    await helius.getHistoricalTokenAccountsByOwner([OWNER]);

    expect(payload(0)).toMatchObject({
      method: "getHistoricalTokenAccountsByOwner",
      params: [OWNER, {}, {}],
    });
  });
});

// Compile-time checks, enforced by `pnpm typecheck` (Jest does not type-check)
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
const assertType = <T extends true>(value: T) => value;

describe("getHistoricalTokenAccountsByOwner types", () => {
  it("types data as the encoded tuple only for base64 encodings", async () => {
    transportMock.mockReset();
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: page([], null),
    });
    const helius = createHelius({ apiKey: "test-key" });
    const request: GetHistoricalTokenAccountsByOwnerRequest = [OWNER];

    const byDefault = await helius.getHistoricalTokenAccountsByOwner([
      OWNER,
      { slot: 445000000 },
      { mint: USDC },
    ]);
    const parsed = await helius.getHistoricalTokenAccountsByOwner([
      OWNER,
      {},
      { encoding: "jsonParsed" },
    ]);
    const fromRequest = await helius.getHistoricalTokenAccountsByOwner(request);

    expect([
      assertType<
        Equals<
          typeof byDefault,
          GetHistoricalTokenAccountsByOwnerResponse<HistoricalEncodedAccountData>
        >
      >(true),
      assertType<
        Equals<typeof parsed, GetHistoricalTokenAccountsByOwnerResponse>
      >(true),
      assertType<
        Equals<typeof fromRequest, GetHistoricalTokenAccountsByOwnerResponse>
      >(true),
    ]).not.toContain(false);
    expect([byDefault, parsed, fromRequest]).toEqual(
      Array(3).fill(page([], null))
    );
  });

  it("requires slot with transactionIndex", () => {
    const indexOnly: GetHistoricalTokenAccountsByOwnerRequest = [
      OWNER,
      // @ts-expect-error transactionIndex requires slot
      { transactionIndex: 10 },
    ];

    expect(indexOnly).toHaveLength(2);
  });

  it("accepts mint or programId, but not both", () => {
    const maybeMint = Date.now() < 0 ? USDC : undefined;

    const byMint: GetHistoricalTokenAccountsByOwnerConfig = { mint: USDC };
    const byProgram: GetHistoricalTokenAccountsByOwnerConfig = {
      programId: TOKEN_2022,
    };
    const optionalMint: GetHistoricalTokenAccountsByOwnerConfig = {
      mint: maybeMint,
    };
    const nextPage: GetHistoricalTokenAccountsByOwnerConfig = {
      ...byMint,
      paginationKey: `${USDC}:A`,
    };
    // @ts-expect-error mint and programId can't be combined
    const both: GetHistoricalTokenAccountsByOwnerConfig = {
      mint: USDC,
      programId: TOKEN_V1,
    };

    expect([byMint, byProgram, optionalMint, nextPage, both]).toHaveLength(5);
  });
});
