import {
  type GetEnhancedTransactionsByAddressRequest,
  type GetEnhancedTransactionsByAddressResponse,
} from "../types";
import { makeEnhancedTxClientEager } from "../client.eager";

describe("Enhanced getTransactionsByAddress Tests", () => {
  const apiKey = "test-key";
  const client = makeEnhancedTxClientEager(apiKey);

  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = fetchMock;
  });

  it("Returns enhanced transactions for an address (happy path)", async () => {
    const mockResponse: GetEnhancedTransactionsByAddressResponse = [
      {
        signature: "0xJEDI123...",
        slot: 987654,
        timestamp: 1_700_000_100,
        type: "NFT_SALE",
        source: "MAGIC_EDEN",
        fee: 12345,
      },
    ];

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as Response);

    const params: GetEnhancedTransactionsByAddressRequest = {
      address: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      limit: 5,
      commitment: "finalized",
      type: "NFT_SALE",
      source: "MAGIC_EDEN",
      before: "someSigBefore",
      until: "someSigUntil",
    };

    const result = await client.getTransactionsByAddress(params);

    expect(result).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];

    expect(typeof url).toBe("string");
    expect(url).toMatch(
      /\/addresses\/86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY\/transactions\?/
    );
    expect(url).toMatch(/api-key=test-key/);
    expect(url).toMatch(/limit=5/);
    expect(url).toMatch(/type=NFT_SALE/);
    expect(url).toMatch(/source=MAGIC_EDEN/);
    expect(url).toMatch(/commitment=finalized/);
    expect(url).toMatch(/before=someSigBefore/);
    expect(url).toMatch(/until=someSigUntil/);

    expect(init).toMatchObject({ method: "GET" });
  });

  it("Throws on non-2xx response", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal",
      text: async () => JSON.stringify({ error: { message: "boom" } }),
    } as Response);

    await expect(
      client.getTransactionsByAddress({
        address: "bad-address",
        limit: 1,
      })
    ).rejects.toThrow("Helius HTTP 500: boom");
  });
});
