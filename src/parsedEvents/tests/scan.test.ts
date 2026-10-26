import { createHeliusEager as createHelius } from "../../rpc/createHelius.eager";
import type {
  ScanMatch,
  ScanParsedTransactionHistoryResponse,
  ScanProgramMatch,
} from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

const PUMP = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SCAN_URL =
  "https://mainnet.helius-rpc.com/v1/parsed-events/scan?api-key=test-key";

// Trimmed from the OpenAPI "Stopped on limit" example
const STOPPED_ON_LIMIT: ScanParsedTransactionHistoryResponse = {
  data: [
    {
      signature:
        "5zmGhmd3JZxXzz8MnA8MM1K7PXRwA1z35n3xT6ZJGRz3sAi25p8jaZuPWFCB4nEPx7DUke9y3pwrd4V7xAFozQBy",
      parserStatus: "OK",
      parsed: {
        slot: 460869102,
        blockTime: 1792848886,
        fee: 45000,
        feePayer: "Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA",
        transactionStatus: "OK",
        error: null,
        decodedError: null,
        nativeTransfers: [],
        tokenTransfers: [],
        summary: null,
        instructions: [],
      },
    },
  ],
  paginationToken: "460869102:203",
  scan: {
    stoppedOn: "limit",
    scannedTransactions: 1,
    matchedTransactions: 1,
    scannedThrough: { slot: 460869102, blockTime: 1792848886 },
    creditsCharged: 11,
  },
};

const respondWith = (body: unknown) =>
  mockFetch.mockResolvedValue({ ok: true, json: async () => body });

const failWith = (status: number, statusText: string, body: unknown) =>
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    statusText,
    text: async () => JSON.stringify(body),
  });

const sentBody = (call = 0) => JSON.parse(mockFetch.mock.calls[call][1].body);

describe("parsedEvents.scan Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("POSTs the address, match, and options to /scan and returns the page", async () => {
    respondWith(STOPPED_ON_LIMIT);

    const params = {
      address: PUMP,
      match: {
        program: { programId: PUMP, instructions: ["buy", "sell"] },
        mints: [USDC],
      },
      limit: 1,
      budget: { maxScannedTransactions: 2000 },
      sortOrder: "asc" as const,
      status: "any" as const,
      commitment: "finalized" as const,
      minContextSlot: 460000000,
      includeRawTransaction: true,
      slot: { gte: 460000000 },
      time: { lt: 1792900000 },
      beforeSignature: "before",
      afterSignature: "after",
      paginationToken: "460000000:0",
    };

    const result = await rpc.parsedEvents.scan(params);

    expect(result).toEqual(STOPPED_ON_LIMIT);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(SCAN_URL);
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual(params);
  });

  it("Sends discriminator matches as given", async () => {
    respondWith(STOPPED_ON_LIMIT);

    await rpc.parsedEvents.scan({
      address: PUMP,
      match: { program: { programId: PUMP, discriminators: ["0x66063d12"] } },
    });

    expect(sentBody()).toEqual({
      address: PUMP,
      match: { program: { programId: PUMP, discriminators: ["0x66063d12"] } },
    });
  });

  it("Returns a page with no matches but a token to keep scanning", async () => {
    // The OpenAPI "Stopped on budget, no matches" example
    const page: ScanParsedTransactionHistoryResponse = {
      data: [],
      paginationToken: "460903064:422",
      scan: {
        stoppedOn: "budget",
        scannedTransactions: 2000,
        matchedTransactions: 0,
        scannedThrough: { slot: 460903064, blockTime: 1792856105 },
        creditsCharged: 12,
      },
    };
    respondWith(page);

    const result = await rpc.parsedEvents.scan({
      address: PUMP,
      match: { program: { programId: PUMP, instructions: ["set_params"] } },
      budget: { maxScannedTransactions: 2000 },
    });

    expect(result.data).toEqual([]);
    expect(result.paginationToken).toBe("460903064:422");
    expect(result.scan.stoppedOn).toBe("budget");
  });

  it("Returns a final page without a paginationToken or scannedThrough", async () => {
    respondWith({
      data: [],
      scan: {
        stoppedOn: "windowEnd",
        scannedTransactions: 0,
        matchedTransactions: 0,
        creditsCharged: 10,
      },
    });

    const result = await rpc.parsedEvents.scan({
      address: PUMP,
      match: { mints: [USDC] },
      time: { gte: 4102444800 },
    });

    expect(result.paginationToken).toBeUndefined();
    expect(result.scan.scannedThrough).toBeUndefined();
    expect(result.scan.stoppedOn).toBe("windowEnd");
  });

  it("Drops nulls at every level but forwards unknown fields for the API to reject", async () => {
    respondWith(STOPPED_ON_LIMIT);

    // e.g. JS callers passing nulls, or a field the API doesn't know
    const request = {
      address: PUMP,
      match: {
        program: {
          programId: PUMP,
          instructions: ["buy"],
          discriminators: null,
        },
        mints: null,
      },
      budget: { maxScannedTransactions: null },
      limit: null,
      slot: { gte: 1, lt: null },
      type: "SWAP",
    };
    await rpc.parsedEvents.scan(
      request as unknown as Parameters<typeof rpc.parsedEvents.scan>[0]
    );

    expect(sentBody()).toEqual({
      address: PUMP,
      match: { program: { programId: PUMP, instructions: ["buy"] } },
      budget: {},
      slot: { gte: 1 },
      type: "SWAP",
    });
  });

  it("Forwards a malformed non-object value as-is instead of sending an empty object", async () => {
    respondWith(STOPPED_ON_LIMIT);

    // e.g. a JS caller passing a timestamp where bounds are expected; it must
    // reach the API to be rejected, not become `{}` (an unbounded scan)
    const request = {
      address: PUMP,
      match: { mints: [USDC] },
      time: 1767225600,
      budget: 2000,
      extra: { nested: null, kept: 1 },
    };
    await rpc.parsedEvents.scan(
      request as unknown as Parameters<typeof rpc.parsedEvents.scan>[0]
    );

    expect(sentBody()).toEqual({
      address: PUMP,
      match: { mints: [USDC] },
      time: 1767225600,
      budget: 2000,
      extra: { kept: 1 },
    });
  });

  it("Serializes objects through toJSON and leaves nulls inside arrays alone", async () => {
    respondWith(STOPPED_ON_LIMIT);

    // e.g. a web3.js PublicKey, which serializes to its base58 string
    class Key {
      constructor(private readonly base58: string) {}
      toJSON() {
        return this.base58;
      }
    }
    const request = {
      address: new Key(PUMP),
      match: {
        program: { programId: new Key(PUMP) },
        mints: [USDC, null],
      },
    };
    await rpc.parsedEvents.scan(
      request as unknown as Parameters<typeof rpc.parsedEvents.scan>[0]
    );

    expect(sentBody()).toEqual({
      address: PUMP,
      match: { program: { programId: PUMP }, mints: [USDC, null] },
    });
  });

  it("Omits a null or empty paginationToken from the request body", async () => {
    respondWith(STOPPED_ON_LIMIT);
    const match = { mints: [USDC] };

    await rpc.parsedEvents.scan({
      address: PUMP,
      match,
      paginationToken: null,
    });
    await rpc.parsedEvents.scan({
      address: PUMP,
      match,
      paginationToken: "",
    });

    expect(sentBody(0)).toEqual({ address: PUMP, match });
    expect(sentBody(1)).toEqual({ address: PUMP, match });
  });

  it("Throws the API's error message on a 400", async () => {
    failWith(400, "Bad Request", {
      error: `match.program.instructions not found in the IDLs of ${PUMP}: not_a_real_ix`,
    });

    await expect(
      rpc.parsedEvents.scan({
        address: PUMP,
        match: {
          program: { programId: PUMP, instructions: ["not_a_real_ix"] },
        },
      })
    ).rejects.toThrow(
      `Helius HTTP 400: match.program.instructions not found in the IDLs of ${PUMP}: not_a_real_ix`
    );
  });

  it("Throws with the status on a 503 at capacity", async () => {
    failWith(503, "Service Unavailable", { error: "service unavailable" });

    await expect(
      rpc.parsedEvents.scan({
        address: PUMP,
        match: { mints: [USDC] },
      })
    ).rejects.toThrow("Helius HTTP 503: service unavailable");
  });
});

describe("ScanMatch types", () => {
  it("requires program or mints, and rejects instructions with discriminators", () => {
    const byProgram: ScanMatch = { program: { programId: PUMP } };
    const byMints: ScanMatch = { mints: [USDC] };
    const byBoth: ScanMatch = {
      program: { programId: PUMP, instructions: ["buy"] },
      mints: [USDC],
    };
    // @ts-expect-error a match needs `program` or `mints`
    const empty: ScanMatch = {};
    // @ts-expect-error `instructions` and `discriminators` can't be combined
    const both: ScanProgramMatch = {
      programId: PUMP,
      instructions: ["buy"],
      discriminators: ["0x66"],
    };

    expect([byProgram, byMints, byBoth, empty, both]).toHaveLength(5);
  });
});
