import {
  address,
  AccountRole,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  isSolanaError,
  SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT,
  type Address,
} from "@solana/kit";
import {
  assertNoAddressLookupsOnV1,
  assertWithinSizeLimit,
} from "../validateTxMessage";

const PROGRAM = address("11111111111111111111111111111111");
const FEE_PAYER = address("11111111111111111111111111111112");
const LOOKUP_TABLE = address("11111111111111111111111111111113");
const TARGET = address("So11111111111111111111111111111111111111112");

const lifetime = {
  blockhash: "5nP4a8kpkJwY5j7cQeWWoJc3qQ9mMxjX8v3d5fWg2JkN" as any,
  lastValidBlockHeight: 1n,
};

const staticIx = (data = 0) => ({
  programAddress: PROGRAM,
  accounts: [{ address: TARGET, role: AccountRole.READONLY }],
  data: new Uint8Array([data]),
});

const lookupIx = () => ({
  programAddress: PROGRAM,
  accounts: [
    {
      address: TARGET,
      addressIndex: 3,
      lookupTableAddress: LOOKUP_TABLE,
      role: AccountRole.READONLY,
    },
  ],
  data: new Uint8Array([1]),
});

const buildMessage = (version: any, instructions: any[]) =>
  pipe(
    createTransactionMessage({ version }),
    (m) => setTransactionMessageFeePayer(FEE_PAYER as Address, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(lifetime, m),
    (m) => appendTransactionMessageInstructions(instructions, m)
  ) as any;

describe("assertNoAddressLookupsOnV1 Tests", () => {
  it("Rejects a lookup-table account on version 1", () => {
    expect(() => assertNoAddressLookupsOnV1(1, [lookupIx()])).toThrow(
      /do not support address lookup tables/i
    );
  });

  it("Names the offending program so the instruction can be found", () => {
    expect(() =>
      assertNoAddressLookupsOnV1(1, [staticIx(), lookupIx()])
    ).toThrow(new RegExp(PROGRAM));
  });

  it("Allows static accounts on version 1", () => {
    expect(() => assertNoAddressLookupsOnV1(1, [staticIx()])).not.toThrow();
  });

  it("Allows instructions with no accounts at all", () => {
    expect(() =>
      assertNoAddressLookupsOnV1(1, [
        { programAddress: PROGRAM, accounts: [], data: new Uint8Array() },
      ])
    ).not.toThrow();
  });

  it("Leaves legacy and v0 alone, where lookup tables are supported", () => {
    expect(() => assertNoAddressLookupsOnV1(0, [lookupIx()])).not.toThrow();
    expect(() =>
      assertNoAddressLookupsOnV1("legacy", [lookupIx()])
    ).not.toThrow();
  });
});

describe("assertWithinSizeLimit Tests", () => {
  // ~30 instructions of 60 data bytes compiles to just over 2KB
  const oversized = Array.from({ length: 30 }, (_, i) => ({
    programAddress: PROGRAM,
    accounts: [],
    data: new Uint8Array(60).fill(i),
  }));

  it("Passes a small message on every version", () => {
    for (const version of ["legacy", 0, 1]) {
      expect(() =>
        assertWithinSizeLimit(buildMessage(version, [staticIx()]))
      ).not.toThrow();
    }
  });

  it("Rejects an oversized v0 message", () => {
    expect(() => assertWithinSizeLimit(buildMessage(0, oversized))).toThrow(
      /exceeds limit of 1232 bytes/i
    );
  });

  it("Throws kit's SolanaError on every version, so the code is checkable", () => {
    const tooBigForV1 = Array.from({ length: 60 }, (_, i) => ({
      programAddress: PROGRAM,
      accounts: [],
      data: new Uint8Array(80).fill(i),
    }));

    for (const [version, instructions] of [
      [0, oversized],
      [1, tooBigForV1],
    ] as const) {
      let thrown: unknown;
      try {
        assertWithinSizeLimit(buildMessage(version, instructions));
      } catch (err) {
        thrown = err;
      }

      expect(
        isSolanaError(thrown, SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT)
      ).toBe(true);
    }
  });

  it("Accepts the same payload on version 1, which has the larger limit", () => {
    expect(() =>
      assertWithinSizeLimit(buildMessage(1, oversized))
    ).not.toThrow();
  });

  it("Rejects a v1 message that is genuinely too big", () => {
    const tooBigForV1 = Array.from({ length: 60 }, (_, i) => ({
      programAddress: PROGRAM,
      accounts: [],
      data: new Uint8Array(80).fill(i),
    }));

    expect(() => assertWithinSizeLimit(buildMessage(1, tooBigForV1))).toThrow(
      /exceeds limit of 4096 bytes/i
    );
  });
});
