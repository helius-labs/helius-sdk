
import { GetTokenAccountsByOwnerV2Result } from "../../../types";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getAllTokenAccountsByOwner (auto-pagination) Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  const owner = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
  const TOKEN_V1 = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Aggregates across multiple unwrapped pages and enforces limit=10000", async () => {
    const page1: GetTokenAccountsByOwnerV2Result = {
      accounts: [
        {
          pubkey: "A",
          account: {
            lamports: 1,
            owner: TOKEN_V1,
            data: { program: "spl-token", parsed: { info: {} } },
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: "cursor-1",
      totalResults: 3,
    };

    const page2: GetTokenAccountsByOwnerV2Result = {
      accounts: [
        {
          pubkey: "B",
          account: {
            lamports: 2,
            owner: TOKEN_V1,
            data: { program: "spl-token", parsed: { info: {} } },
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: "cursor-2",
      totalResults: 3,
    };

    const page3: GetTokenAccountsByOwnerV2Result = {
      accounts: [
        {
          pubkey: "C",
          account: {
            lamports: 3,
            owner: TOKEN_V1,
            data: { program: "spl-token", parsed: { info: {} } },
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: null,
      totalResults: 3,
    };

    transportMock
      .mockResolvedValueOnce({ jsonrpc: "2.0", id: "1", result: page1 })
      .mockResolvedValueOnce({ jsonrpc: "2.0", id: "1", result: page2 })
      .mockResolvedValueOnce({ jsonrpc: "2.0", id: "1", result: page3 });

    const options = {
      encoding: "jsonParsed" as const,
      changedSinceSlot: 363_340_000,
    };

    const all = await rpc.getAllTokenAccountsByOwner(
      owner,
      { programId: TOKEN_V1 },
      options
    );

    expect(all.map((a: { pubkey: any; }) => a.pubkey)).toEqual(["A", "B", "C"]);

    // First call payload
    const firstPayload = transportMock.mock.calls[0][0].payload;
    expect(firstPayload.method).toBe("getTokenAccountsByOwnerV2");
    expect(firstPayload.params).toEqual([
      owner,
      { programId: TOKEN_V1 },
      expect.objectContaining({
        encoding: "jsonParsed",
        changedSinceSlot: 363_340_000,
        limit: 10_000,
      }),
    ]);

    // Last call payload includes last cursor
    const lastPayload = transportMock.mock.calls[2][0].payload;
    expect(lastPayload.params).toEqual([
      owner,
      { programId: TOKEN_V1 },
      expect.objectContaining({
        encoding: "jsonParsed",
        limit: 10_000,
        paginationKey: "cursor-2",
      }),
    ]);
  });

  it("Supports wrapped RpcResponse pages (context/value)", async () => {
    const wrapped1 = {
      context: { slot: 111 },
      value: {
        accounts: [
          {
            pubkey: "W1",
            account: {
              lamports: 10,
              owner: TOKEN_V1,
              data: { program: "spl-token", parsed: { info: {} } },
              executable: false,
              rentEpoch: 0,
              space: 165,
            },
          },
        ],
        paginationKey: "w-cursor",
        totalResults: 2,
      },
    };
    const wrapped2 = {
      context: { slot: 112 },
      value: {
        accounts: [
          {
            pubkey: "W2",
            account: {
              lamports: 20,
              owner: TOKEN_V1,
              data: { program: "spl-token", parsed: { info: {} } },
              executable: false,
              rentEpoch: 0,
              space: 165,
            },
          },
        ],
        paginationKey: null,
        totalResults: 2,
      },
    };

    transportMock
      .mockResolvedValueOnce({ jsonrpc: "2.0", id: "1", result: wrapped1 })
      .mockResolvedValueOnce({ jsonrpc: "2.0", id: "1", result: wrapped2 });

    const all = await rpc.getAllTokenAccountsByOwner(
      owner,
      { programId: TOKEN_V1 },
      { encoding: "jsonParsed" }
    );

    expect(all.map((a: { pubkey: any; }) => a.pubkey)).toEqual(["W1", "W2"]);
    expect(transportMock).toHaveBeenCalledTimes(2);
  });

  it("Filters by mint", async () => {
    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    const page: GetTokenAccountsByOwnerV2Result = {
      accounts: [
        {
          pubkey: "USDCacc1",
          account: {
            lamports: 0,
            owner: TOKEN_V1,
            data: { program: "spl-token", parsed: { info: { mint: usdcMint } } },
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: null,
      totalResults: 1,
    };

    transportMock.mockResolvedValueOnce({
      jsonrpc: "2.0",
      id: "1",
      result: page,
    });

    const all = await rpc.getAllTokenAccountsByOwner(
      owner,
      { mint: usdcMint },
      { encoding: "jsonParsed" }
    );

    expect(all.map((a: { pubkey: any; }) => a.pubkey)).toEqual(["USDCacc1"]);

    const payload = transportMock.mock.calls[0][0].payload;
    expect(payload.method).toBe("getTokenAccountsByOwnerV2");
    expect(payload.params).toEqual([
      owner,
      { mint: usdcMint },
      expect.objectContaining({ encoding: "jsonParsed", limit: 10_000 }),
    ]);
  });

  it("Supports Token-2022 with base64 pages", async () => {
    const page: GetTokenAccountsByOwnerV2Result = {
      accounts: [
        {
          pubkey: "Base64Acc",
          account: {
            lamports: 0,
            owner: TOKEN_2022,
            data: ["BASE64_DATA", "base64"], // base64 => [data, encoding]
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: null,
      totalResults: 1,
    };

    transportMock.mockResolvedValueOnce({
      jsonrpc: "2.0",
      id: "1",
      result: page,
    });

    const all = await rpc.getAllTokenAccountsByOwner(
      owner,
      { programId: TOKEN_2022 },
      { encoding: "base64" }
    );

    expect(all.map((a: { pubkey: any; }) => a.pubkey)).toEqual(["Base64Acc"]);
    expect(Array.isArray(all[0].account.data)).toBe(true);

    const payload = transportMock.mock.calls[0][0].payload;
    expect(payload.params).toEqual([
      owner,
      { programId: TOKEN_2022 },
      expect.objectContaining({ encoding: "base64", limit: 10_000 }),
    ]);
  });

  it("Bubbles up RPC errors from any page", async () => {
    const okFirst: GetTokenAccountsByOwnerV2Result = {
      accounts: [
        {
          pubkey: "OK",
          account: {
            lamports: 1,
            owner: TOKEN_V1,
            data: { program: "spl-token", parsed: { info: {} } },
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: "will-error",
      totalResults: 2,
    };

    transportMock
      .mockResolvedValueOnce({ jsonrpc: "2.0", id: "1", result: okFirst })
      .mockResolvedValueOnce({
        jsonrpc: "2.0",
        id: "1",
        error: { code: -32603, message: "Internal error" },
      });

    await expect(
      rpc.getAllTokenAccountsByOwner(owner, { programId: TOKEN_V1 }, { encoding: "jsonParsed" })
    ).rejects.toThrow(/Internal error/);

    const secondPayload = transportMock.mock.calls[1][0].payload;
    expect(secondPayload.params).toEqual([
      owner,
      { programId: TOKEN_V1 },
      expect.objectContaining({ encoding: "jsonParsed", limit: 10_000, paginationKey: "will-error" }),
    ]);
  });
});
