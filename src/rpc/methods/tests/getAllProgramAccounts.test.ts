import { GetProgramAccountsV2Result } from "../../../types";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getAllProgramAccounts (auto-pagination) Tests", () => {
  let rpc: ReturnType<typeof createHelius>;
  const programId = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Aggregates across multiple unwrapped pages and enforces limit=10000", async () => {
    const page1: GetProgramAccountsV2Result = {
      accounts: [
        {
          pubkey: "A",
          account: {
            lamports: 1,
            owner: programId,
            data: ["AAA", "base64"],
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: "cursor-1",
      totalResults: 3,
    };

    const page2: GetProgramAccountsV2Result = {
      accounts: [
        {
          pubkey: "B",
          account: {
            lamports: 2,
            owner: programId,
            data: ["BBB", "base64"],
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: "cursor-2",
      totalResults: 3,
    };

    const page3: GetProgramAccountsV2Result = {
      accounts: [
        {
          pubkey: "C",
          account: {
            lamports: 3,
            owner: programId,
            data: ["CCC", "base64"],
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: null,
      totalResults: 3,
    };

    // Mock each page in order
    transportMock
      .mockResolvedValueOnce({ jsonrpc: "2.0", id: "1", result: page1 })
      .mockResolvedValueOnce({ jsonrpc: "2.0", id: "1", result: page2 })
      .mockResolvedValueOnce({ jsonrpc: "2.0", id: "1", result: page3 });

    const options = {
      encoding: "base64" as const,
      filters: [{ dataSize: 165 }],
      changedSinceSlot: 12_345_678,
    };

    const all = await rpc.getAllProgramAccounts(programId, options);
    expect(all.map((a) => a.pubkey)).toEqual(["A", "B", "C"]);

    // Assert the first call payload (no paginationKey)
    const firstPayload = transportMock.mock.calls[0][0].payload;
    expect(firstPayload.method).toBe("getProgramAccountsV2");
    expect(firstPayload.params).toEqual([
      programId,
      expect.objectContaining({
        encoding: "base64",
        filters: [{ dataSize: 165 }],
        changedSinceSlot: 12_345_678,
        limit: 10_000, // enforced
      }),
    ]);

    // Assert the last call payload does include the last cursor
    const lastPayload = transportMock.mock.calls[2][0].payload;
    expect(lastPayload.method).toBe("getProgramAccountsV2");
    expect(lastPayload.params).toEqual([
      programId,
      expect.objectContaining({
        encoding: "base64",
        filters: [{ dataSize: 165 }],
        changedSinceSlot: 12_345_678,
        limit: 10_000,
        paginationKey: "cursor-2",
      }),
    ]);
  });

  it("Supports wrapped RpcResponse pages (context/value) as well", async () => {
    const wrapped1 = {
      context: { slot: 111 },
      value: {
        accounts: [
          {
            pubkey: "W1",
            account: {
              lamports: 10,
              owner: programId,
              data: ["W1", "base64"],
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
              owner: programId,
              data: ["W2", "base64"],
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

    const all = await rpc.getAllProgramAccounts(programId, {
      encoding: "base64",
      filters: [{ dataSize: 165 }],
    });

    expect(all.map((a) => a.pubkey)).toEqual(["W1", "W2"]);
    expect(transportMock).toHaveBeenCalledTimes(2);
  });

  it("Bubbles up RPC errors from any page", async () => {
    const okFirst: GetProgramAccountsV2Result = {
      accounts: [
        {
          pubkey: "OK",
          account: {
            lamports: 1,
            owner: programId,
            data: ["OK", "base64"],
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
      rpc.getAllProgramAccounts(programId, { encoding: "base64" })
    ).rejects.toThrow(/Internal error/);

    // Ensure second call carried the cursor
    const secondPayload = transportMock.mock.calls[1][0].payload;
    expect(secondPayload.params).toEqual([
      programId,
      expect.objectContaining({
        encoding: "base64",
        limit: 10_000,
        paginationKey: "will-error",
      }),
    ]);
  });

  it("Passes through 'withContext' in options", async () => {
    const p1 = {
      context: { slot: 1 },
      value: {
        accounts: [
          {
            pubkey: "CTX1",
            account: {
              lamports: 1,
              owner: programId,
              data: ["", "base64"],
              executable: false,
              rentEpoch: 0,
              space: 165,
            },
          },
        ],
        paginationKey: null,
        totalResults: 1,
      },
    };

    transportMock.mockResolvedValueOnce({
      jsonrpc: "2.0",
      id: "1",
      result: p1,
    });

    const all = await rpc.getAllProgramAccounts(programId, {
      withContext: true,
      encoding: "base64",
    });

    expect(all.map((a) => a.pubkey)).toEqual(["CTX1"]);

    const payload = transportMock.mock.calls[0][0].payload;
    expect(payload.params).toEqual([
      programId,
      expect.objectContaining({
        withContext: true,
        encoding: "base64",
        limit: 10_000,
      }),
    ]);
  });
});
