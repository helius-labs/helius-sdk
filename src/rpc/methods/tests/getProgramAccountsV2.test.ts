import {
  GetProgramAccountsV2Request,
  GetProgramAccountsV2Result,
} from "../../../types";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getProgramAccountsV2 Tests", () => {
  let rpc: ReturnType<typeof createHelius>;
  const programId = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Fetches the first page with config (encoding/limit/filters/changedSinceSlot)", async () => {
    const mockResponse: GetProgramAccountsV2Result = {
      accounts: [
        {
          pubkey: "CxELquR1gPP8wHe33gZ4QxqGB3sZ9RSwsJ2KshVewkFY",
          account: {
            lamports: 15298080,
            owner: programId,
            data: ["AAAA", "base64"],
            executable: false,
            rentEpoch: 28,
            space: 165,
          },
        },
        {
          pubkey: "8JYxjWm3Jm5Ck3P6mEhg2X1kJr1Qy9qWz8v5kQh2s8s9",
          account: {
            lamports: 999999,
            owner: programId,
            data: ["BBBB", "base64"],
            executable: false,
            rentEpoch: 30,
            space: 165,
          },
        },
      ],
      paginationKey: "next-cursor",
      totalResults: 25000,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params: GetProgramAccountsV2Request = [
      programId,
      {
        encoding: "base64",
        limit: 1000,
        changedSinceSlot: 12_345_678,
        filters: [{ dataSize: 165 }],
      },
    ];

    const result = await rpc.getProgramAccountsV2(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getProgramAccountsV2",
          params,
        }),
      })
    );
  });

  it("Fetches the next page using the paginationKey", async () => {
    const firstPage: GetProgramAccountsV2Result = {
      accounts: [
        {
          pubkey: "First",
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
      paginationKey: "cursor-1",
      totalResults: 3,
    };
    const secondPage: GetProgramAccountsV2Result = {
      accounts: [
        {
          pubkey: "Second",
          account: {
            lamports: 2,
            owner: programId,
            data: ["", "base64"],
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
        {
          pubkey: "Third",
          account: {
            lamports: 3,
            owner: programId,
            data: ["", "base64"],
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: null,
      totalResults: 3,
    };

    // First call returns first page
    transportMock.mockResolvedValueOnce({
      jsonrpc: "2.0",
      id: "1",
      result: firstPage,
    });

    // Second call returns second page
    transportMock.mockResolvedValueOnce({
      jsonrpc: "2.0",
      id: "1",
      result: secondPage,
    });

    const res1 = await rpc.getProgramAccountsV2([
      programId,
      { encoding: "base64", limit: 1_000, filters: [{ dataSize: 165 }] },
    ]);
    expect(res1).toEqual(firstPage);

    const res2 = await rpc.getProgramAccountsV2([
      programId,
      { encoding: "base64", limit: 1_000, paginationKey: res1.paginationKey! },
    ]);
    expect(res2).toEqual(secondPage);

    // Verify the second call carried the cursor through
    expect(transportMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getProgramAccountsV2",
          params: [
            programId,
            { encoding: "base64", limit: 1000, paginationKey: "cursor-1" },
          ],
        }),
      })
    );
  });

  it("Supports the withContext param", async () => {
    const wrapped = {
      context: { slot: 341197933 },
      value: {
        accounts: [
          {
            pubkey: "Wrapped",
            account: {
              lamports: 42,
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

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: wrapped,
    });

    const res = await rpc.getProgramAccountsV2([
      programId,
      { withContext: true, encoding: "base64", limit: 10 },
    ]);

    expect(res).toEqual(wrapped);
    expect((res as any).value.accounts[0].pubkey).toBe("Wrapped");
  });

  it("Handles RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    await expect(
      rpc.getProgramAccountsV2([
        programId,
        { encoding: "base64", limit: 0 }, // Invalid on purpose
      ])
    ).rejects.toThrow(/Invalid params/);

    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getProgramAccountsV2",
        }),
      })
    );
  });
});
