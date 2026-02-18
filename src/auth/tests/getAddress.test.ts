import { getAddress } from "../getAddress";
import { generateKeypair } from "../generateKeypair";
import { loadKeypair } from "../loadKeypair";

describe("getAddress", () => {
  it("returns a base58 address string", async () => {
    const { secretKey } = await generateKeypair();
    const keypair = loadKeypair(secretKey);
    const address = await getAddress(keypair);

    expect(typeof address).toBe("string");
    expect(address.length).toBeGreaterThanOrEqual(32);
    expect(address.length).toBeLessThanOrEqual(44);
  });

  it("returns the same address for the same keypair", async () => {
    const { secretKey } = await generateKeypair();
    const keypair = loadKeypair(secretKey);

    const a = await getAddress(keypair);
    const b = await getAddress(keypair);

    expect(a).toBe(b);
  });

  it("returns different addresses for different keypairs", async () => {
    const kp1 = loadKeypair((await generateKeypair()).secretKey);
    const kp2 = loadKeypair((await generateKeypair()).secretKey);

    const addr1 = await getAddress(kp1);
    const addr2 = await getAddress(kp2);

    expect(addr1).not.toBe(addr2);
  });
});
