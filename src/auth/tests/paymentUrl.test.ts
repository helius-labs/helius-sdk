import { buildPaymentUrl, resolvePaymentHost } from "../paymentUrl";
import { PAYMENT_HOST } from "../constants";

describe("paymentUrl", () => {
  const originalEnv = process.env.HELIUS_PAYMENT_HOST;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.HELIUS_PAYMENT_HOST;
    } else {
      process.env.HELIUS_PAYMENT_HOST = originalEnv;
    }
  });

  it("falls back to PAYMENT_HOST when no override or env is set", () => {
    delete process.env.HELIUS_PAYMENT_HOST;
    expect(resolvePaymentHost()).toBe(PAYMENT_HOST);
  });

  it("uses HELIUS_PAYMENT_HOST env var when set", () => {
    process.env.HELIUS_PAYMENT_HOST = "https://staging.example.com";
    expect(resolvePaymentHost()).toBe("https://staging.example.com");
  });

  it("explicit override beats env and constant", () => {
    process.env.HELIUS_PAYMENT_HOST = "https://staging.example.com";
    expect(resolvePaymentHost("https://override.example.com")).toBe(
      "https://override.example.com"
    );
  });

  it("ignores empty-string env value", () => {
    process.env.HELIUS_PAYMENT_HOST = "";
    expect(resolvePaymentHost()).toBe(PAYMENT_HOST);
  });

  it("strips trailing slash from override and env", () => {
    expect(resolvePaymentHost("https://x.example/")).toBe("https://x.example");
    process.env.HELIUS_PAYMENT_HOST = "https://y.example/";
    expect(resolvePaymentHost()).toBe("https://y.example");
  });

  it("buildPaymentUrl composes host + /pay/<id>", () => {
    delete process.env.HELIUS_PAYMENT_HOST;
    expect(buildPaymentUrl("pi_abc")).toBe(`${PAYMENT_HOST}/pay/pi_abc`);
    expect(buildPaymentUrl("pi_xyz", "https://staging.example.com")).toBe(
      "https://staging.example.com/pay/pi_xyz"
    );
  });
});
