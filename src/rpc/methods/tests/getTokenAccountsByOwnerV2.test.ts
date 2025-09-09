
import { GetTokenAccountsByOwnerV2Request, GetTokenAccountsByOwnerV2Result } from "../../../types";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getTokenAccountsByOwnerV2 Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  const owner = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
  const TOKEN_V1 = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Fetches the first page for a SPL Token (jsonParsed, limit)", async () => {
    const mockResponse: GetTokenAccountsByOwnerV2Result = {
      accounts: [
        {
          pubkey: "BGocb4GEpbTFm8UFV2VsDSaBXHELPfAXrvd4vtt8QWrA",
          account: {
            lamports: 2039280,
            owner: TOKEN_V1,
            data: {
              program: "spl-token",
              parsed: {
                info: {
                  isNative: false,
                  mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                  owner,
                  state: "initialized",
                  tokenAmount: {
                    amount: "420000000000000",
                    decimals: 6,
                    uiAmount: 420000000,
                    uiAmountString: "420000000",
                  },
                },
              },
              space: 165,
            },
            executable: false,
            rentEpoch: 18446744073709552000n as unknown as number,
            space: 165,
          },
        },
      ],
      paginationKey: "cursor-1",
      totalResults: 5000,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params: GetTokenAccountsByOwnerV2Request = [
      owner,
      { programId: TOKEN_V1 },
      { encoding: "jsonParsed", limit: 10 },
    ];

    const result = await rpc.getTokenAccountsByOwnerV2(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTokenAccountsByOwnerV2",
          params,
        }),
      })
    );
  });

  it("Continues pagination using the paginationKey", async () => {
    const page1: GetTokenAccountsByOwnerV2Result = {
      accounts: [{ pubkey: "First", account: { lamports: 1, owner: TOKEN_V1, data: { parsed: { info: {} } }, executable: false, rentEpoch: 0, space: 165 } }],
      paginationKey: "next-1",
      totalResults: 3,
    };
    const page2: GetTokenAccountsByOwnerV2Result = {
      accounts: [
        { pubkey: "Second", account: { lamports: 2, owner: TOKEN_V1, data: { parsed: { info: {} } }, executable: false, rentEpoch: 0, space: 165 } },
        { pubkey: "Third", account: { lamports: 3, owner: TOKEN_V1, data: { parsed: { info: {} } }, executable: false, rentEpoch: 0, space: 165 } },
      ],
      paginationKey: null,
      totalResults: 3,
    };

    transportMock.mockResolvedValueOnce({
      jsonrpc: "2.0",
      id: "1",
      result: page1,
    });
    transportMock.mockResolvedValueOnce({
      jsonrpc: "2.0",
      id: "1",
      result: page2,
    });

    const res1 = await rpc.getTokenAccountsByOwnerV2([
      owner,
      { programId: TOKEN_V1 },
      { encoding: "jsonParsed", limit: 1000 },
    ]);
    expect(res1).toEqual(page1);

    const res2 = await rpc.getTokenAccountsByOwnerV2([
      owner,
      { programId: TOKEN_V1 },
      { encoding: "jsonParsed", limit: 1000, paginationKey: res1.paginationKey! },
    ]);
    expect(res2).toEqual(page2);

    expect(transportMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTokenAccountsByOwnerV2",
          params: [
            owner,
            { programId: TOKEN_V1 },
            { encoding: "jsonParsed", limit: 1000, paginationKey: "next-1" },
          ],
        }),
      })
    );
  });

  it("Filters by mint and supports changedSinceSlot", async () => {
    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const mock: GetTokenAccountsByOwnerV2Result = {
      accounts: [
        {
          pubkey: "USDCacc1",
          account: {
            lamports: 0,
            owner: TOKEN_V1,
            data: {
              program: "spl-token",
              parsed: { info: { mint: usdcMint, owner, tokenAmount: { uiAmountString: "1.23" } } },
            },
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: null,
      totalResults: 1,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mock,
    });

    const result = await rpc.getTokenAccountsByOwnerV2([
      owner,
      { mint: usdcMint },
      { encoding: "jsonParsed", changedSinceSlot: 363_340_000 },
    ]);

    expect(result).toEqual(mock);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTokenAccountsByOwnerV2",
          params: [
            owner,
            { mint: usdcMint },
            { encoding: "jsonParsed", changedSinceSlot: 363_340_000 },
          ],
        }),
      })
    );
  });

  it("Supports Token-2022 program and base64 encoding", async () => {
    const mock: GetTokenAccountsByOwnerV2Result = {
      accounts: [
        {
          pubkey: "Base64Acc",
          account: {
            lamports: 0,
            owner: TOKEN_2022,
            data: ["BASE64_DATA_HERE", "base64"], // base64 encoding => [data, encoding]
            executable: false,
            rentEpoch: 0,
            space: 165,
          },
        },
      ],
      paginationKey: null,
      totalResults: 1,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mock,
    });

    const res = await rpc.getTokenAccountsByOwnerV2([
      owner,
      { programId: TOKEN_2022 },
      { encoding: "base64", limit: 2 },
    ]);

    expect(res).toEqual(mock);
    expect(Array.isArray(res.accounts[0].account.data)).toBe(true);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTokenAccountsByOwnerV2",
          params: [
            owner,
            { programId: TOKEN_2022 },
            { encoding: "base64", limit: 2 },
          ],
        }),
      })
    );
  });

  it("Handles RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    await expect(
      rpc.getTokenAccountsByOwnerV2([
        owner,
        { programId: TOKEN_V1 },
        { encoding: "jsonParsed", limit: 0 }, // Invalid on purpose
      ])
    ).rejects.toThrow(/Invalid params/);

    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTokenAccountsByOwnerV2",
        }),
      })
    );
  });
});
