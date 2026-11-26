import {
  airdropFactory,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
} from "@solana/kit";
import { makeAirdrop } from "../airdrop.js";

jest.mock("@solana/kit", () => ({
  ...jest.requireActual("@solana/kit"),
  airdropFactory: jest.fn(),
}));

const factory = airdropFactory as jest.MockedFunction<typeof airdropFactory>;

const RECIPIENT = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
const SIG =
  "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW";

const rpc = {} as Rpc<SolanaRpcApi>;
const subs = {
  tag: "subs",
} as unknown as RpcSubscriptions<SolanaRpcSubscriptionsApi>;

describe("airdrop", () => {
  let airdropImpl: jest.Mock;
  let getSubs: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    airdropImpl = jest.fn().mockResolvedValue(SIG);
    factory.mockReturnValue(airdropImpl);
    getSubs = jest.fn().mockResolvedValue(subs);
  });

  it("requests and confirms through kit's airdropFactory", async () => {
    const airdrop = makeAirdrop(rpc, getSubs, false);

    await expect(airdrop(RECIPIENT, 1_000_000_000n)).resolves.toBe(SIG);

    expect(factory).toHaveBeenCalledWith({ rpc, rpcSubscriptions: subs });
    expect(airdropImpl).toHaveBeenCalledWith({
      recipientAddress: RECIPIENT,
      lamports: 1_000_000_000n,
      commitment: "confirmed",
      abortSignal: undefined,
    });
  });

  it("accepts a number of lamports", async () => {
    await makeAirdrop(rpc, getSubs, false)(RECIPIENT, 5_000);

    expect(airdropImpl.mock.calls[0][0].lamports).toBe(5_000n);
  });

  it("passes commitment and abortSignal through", async () => {
    const abortSignal = new AbortController().signal;

    await makeAirdrop(rpc, getSubs, false)(RECIPIENT, 1n, {
      commitment: "finalized",
      abortSignal,
    });

    expect(airdropImpl.mock.calls[0][0]).toMatchObject({
      commitment: "finalized",
      abortSignal,
    });
  });

  it("rejects on mainnet without opening subscriptions or requesting", async () => {
    await expect(
      makeAirdrop(rpc, getSubs, true)(RECIPIENT, 1n)
    ).rejects.toThrow("airdrop is devnet-only");

    expect(getSubs).not.toHaveBeenCalled();
    expect(airdropImpl).not.toHaveBeenCalled();
  });

  it("rejects an invalid address without requesting", async () => {
    await expect(
      makeAirdrop(rpc, getSubs, false)("not-an-address", 1n)
    ).rejects.toThrow();

    expect(airdropImpl).not.toHaveBeenCalled();
  });

  it("rejects a fractional lamport amount without requesting", async () => {
    await expect(
      makeAirdrop(rpc, getSubs, false)(RECIPIENT, 0.5)
    ).rejects.toThrow(RangeError);

    expect(airdropImpl).not.toHaveBeenCalled();
  });
});
