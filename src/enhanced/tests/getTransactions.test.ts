import {
  type GetEnhancedTransactionsRequest,
  type GetEnhancedTransactionsResponse,
} from "../types";
import { makeEnhancedTxClientEager } from "../client.eager";

describe("Enhanced getTransactions Tests", () => {
  const apiKey = "test-key";
  const client = makeEnhancedTxClientEager(apiKey);

  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = fetchMock;
  });

  it("Returns enhanced transactions (happy path)", async () => {
    const mockResponse: GetEnhancedTransactionsResponse = [
      {
        signature: "0xORDER66...",
        slot: 123456,
        timestamp: 1_700_000_001,
        type: "TRANSFER",
        source: "JUPITER",
        fee: 5000,
      },
      {
        signature: "0xKYBER1138...",
        slot: 123457,
        timestamp: 1_700_000_010,
        type: "SWAP",
        source: "JUPITER",
        fee: 6000,
      },
    ];

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as Response);

    const params: GetEnhancedTransactionsRequest = {
      transactions: ["0xORDER66...", "0xKYBER1138..."],
      commitment: "finalized",
    };

    const result = await client.getTransactions(params);

    expect(result).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(typeof url).toBe("string");
    expect(url).toMatch(/\/transactions\?/);
    expect(url).toMatch(/api-key=test-key/);
    expect(url).toMatch(/commitment=finalized/);

    expect(init).toMatchObject({
      method: "POST",
      body: JSON.stringify({ transactions: params.transactions }),
    });
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("Throws on non-2xx response", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () =>
        JSON.stringify({ error: { message: "You did a bad thing" } }),
    } as Response);

    await expect(
      client.getTransactions({ transactions: ["bad-tx"] })
    ).rejects.toThrow("Helius HTTP 400: You did a bad thing");
  });
});
