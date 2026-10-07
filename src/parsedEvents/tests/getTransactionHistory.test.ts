import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";
import type { GetParsedTransactionHistoryResponse } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

const ADDRESS = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";

describe("parsedEvents.getTransactionHistory Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("POSTs the address and filters as a JSON body", async () => {
    const mockResponse: GetParsedTransactionHistoryResponse = {
      data: [
        {
          signature: "sig1",
          parserStatus: "ERROR",
          parserError: { code: "transaction_not_found", message: "not found" },
        },
      ],
      paginationToken: "433950192:12",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const params = {
      address: ADDRESS,
      limit: 50,
      sortOrder: "asc" as const,
      slot: { gte: 433000000 },
      time: { lt: 1784487060 },
      paginationToken: "433000000:0",
    };

    const result = await rpc.parsedEvents.getTransactionHistory(params);

    expect(result).toEqual(mockResponse);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://mainnet.helius-rpc.com/v1/parsed-events/transaction-history?api-key=test-key"
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual(params);
  });

  it("Returns a final page without a paginationToken", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const result = await rpc.parsedEvents.getTransactionHistory({
      address: ADDRESS,
    });

    expect(result.data).toEqual([]);
    expect(result.paginationToken).toBeUndefined();
  });

  it("Drops nulls but forwards unknown fields for the API to reject", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    // e.g. an old enhanced request object, or JS callers passing nulls
    const legacy = {
      address: ADDRESS,
      beforeSignature: null,
      limit: 10,
      gteTime: 1767225600,
      type: "SWAP",
      slot: { gte: 1, lt: null },
    };
    await rpc.parsedEvents.getTransactionHistory(
      legacy as unknown as Parameters<
        typeof rpc.parsedEvents.getTransactionHistory
      >[0]
    );

    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      address: ADDRESS,
      limit: 10,
      gteTime: 1767225600,
      type: "SWAP",
      slot: { gte: 1 },
    });
  });

  it("Omits a null or empty paginationToken from the request body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], paginationToken: null }),
    });

    await rpc.parsedEvents.getTransactionHistory({
      address: ADDRESS,
      paginationToken: null,
    });
    await rpc.parsedEvents.getTransactionHistory({
      address: ADDRESS,
      paginationToken: "",
    });

    for (const [, init] of mockFetch.mock.calls) {
      expect(JSON.parse(init.body)).toEqual({ address: ADDRESS });
    }
  });
});
