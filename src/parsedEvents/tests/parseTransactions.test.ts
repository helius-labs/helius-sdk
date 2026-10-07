import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";
import type { ParseTransactionsResponse } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

const SIG =
  "5xSKzM8bvpudE521jikHqASzMr23Ms4X4ieY3K8oFPFrJWCSSgYocJmHznrR8b12voDxKDH8ykdCLXSRrx6duVLH";

describe("parsedEvents.parseTransactions Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("POSTs signatures and returns per-item results", async () => {
    const mockResponse: ParseTransactionsResponse = [
      {
        signature: SIG,
        parserStatus: "OK",
        parsed: {
          slot: 433950192,
          blockTime: 1784487060,
          fee: 2005000,
          feePayer: "GV6UUmNxz2RpKxmNAPadYKb7uQpszwqQAu3qLJxVdC52",
          transactionStatus: "OK",
          error: null,
          decodedError: null,
          nativeTransfers: [],
          tokenTransfers: [
            {
              fromUserAccount: "GV6UUmNxz2RpKxmNAPadYKb7uQpszwqQAu3qLJxVdC52",
              toUserAccount: "7iWnBRRhBCiNXXPhqiGzvvBkKrvFSWqqmxRyu9VyYBxE",
              fromTokenAccount: "teBPkZtsnaKDpGHTy1KUZeh1PbVtbrKXhzruYpRiUUs",
              toTokenAccount: "2oL6my4QDDCfpgJZX1bZV1NgbmuNptKdgcE8wJm6efgk",
              rawTokenAmount: 1498500000000,
              decimals: 9,
              tokenStandard: "Fungible",
              mint: "So11111111111111111111111111111111111111112",
            },
          ],
          summary: {
            type: "swap",
            description: "Swapped SOL for USDC",
            parsedData: { protocol: "jupiter" },
          },
          instructions: [],
        },
      },
      {
        signature: "missing",
        parserStatus: "ERROR",
        parserError: {
          code: "transaction_not_found",
          message: "transaction not found",
        },
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await rpc.parsedEvents.parseTransactions({
      transactions: [SIG, "missing"],
      commitment: "finalized",
      includeRawTransaction: true,
    });

    expect(result).toEqual(mockResponse);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://mainnet.helius-rpc.com/v1/parsed-events/transactions?api-key=test-key"
    );
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["User-Agent"]).toMatch(/^helius-node-sdk\//);
    expect(JSON.parse(init.body)).toEqual({
      transactions: [SIG, "missing"],
      commitment: "finalized",
      includeRawTransaction: true,
    });
  });

  it("Throws the API error message on a request-level failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => JSON.stringify({ error: "invalid request payload" }),
    });

    await expect(
      rpc.parsedEvents.parseTransactions({ transactions: [] })
    ).rejects.toThrow("Helius HTTP 400: invalid request payload");
  });

  it("Reads the message from a JSON-RPC style gateway error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () =>
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32401, message: "invalid api key provided" },
        }),
    });

    await expect(
      rpc.parsedEvents.parseTransactions({ transactions: [SIG] })
    ).rejects.toThrow("Helius HTTP 401: invalid api key provided");
  });

  it.each([
    [
      { message: "Plan does not include this endpoint" },
      "Plan does not include this endpoint",
    ],
    [{ error: "" }, "Forbidden"],
  ])("Falls back through message fields for %j", async (body, expected) => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () => JSON.stringify(body),
    });

    await expect(
      rpc.parsedEvents.parseTransactions({ transactions: [SIG] })
    ).rejects.toThrow(`Helius HTTP 403: ${expected}`);
  });

  it("Drops null fields from the request body", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

    await rpc.parsedEvents.parseTransactions({
      transactions: [SIG],
      commitment: null,
      limit: 5,
    } as unknown as Parameters<typeof rpc.parsedEvents.parseTransactions>[0]);

    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      transactions: [SIG],
      limit: 5,
    });
  });

  it("Keeps the raw body when the error response is not JSON", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: async () => "<html>Bad Gateway</html>",
    });

    await expect(
      rpc.parsedEvents.parseTransactions({ transactions: [SIG] })
    ).rejects.toThrow("Helius HTTP 502: <html>Bad Gateway</html>");
  });

  it("Falls back to statusText when the error body is empty", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: async () => "",
    });

    await expect(
      rpc.parsedEvents.parseTransactions({ transactions: [SIG] })
    ).rejects.toThrow("Helius HTTP 429: Too Many Requests");
  });
});
