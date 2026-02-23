import { isRetryableError, retryWithBackoff } from "../retry";

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  sleep: jest.fn().mockResolvedValue(undefined),
}));

describe("isRetryableError", () => {
  it("returns true for 5xx API errors", () => {
    expect(isRetryableError(new Error("API error (500): Internal"))).toBe(true);
    expect(isRetryableError(new Error("API error (503): Unavailable"))).toBe(
      true
    );
  });

  it("returns false for 4xx API errors", () => {
    expect(isRetryableError(new Error("API error (400): Bad Request"))).toBe(
      false
    );
    expect(isRetryableError(new Error("API error (404): Not Found"))).toBe(
      false
    );
  });

  it("returns true for network errors (no status code)", () => {
    expect(isRetryableError(new Error("fetch failed"))).toBe(true);
  });

  it("returns true for non-Error values", () => {
    expect(isRetryableError("string error")).toBe(true);
    expect(isRetryableError(null)).toBe(true);
  });
});

describe("retryWithBackoff", () => {
  it("returns on first success", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const result = await retryWithBackoff(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx and succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("API error (500): Internal"))
      .mockResolvedValue("ok");

    const result = await retryWithBackoff(fn, 3, 0);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 4xx errors", async () => {
    const fn = jest
      .fn()
      .mockRejectedValue(new Error("API error (400): Bad Request"));

    await expect(retryWithBackoff(fn, 3, 0)).rejects.toThrow("API error (400)");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting retries", async () => {
    const fn = jest
      .fn()
      .mockRejectedValue(new Error("API error (500): Internal"));

    await expect(retryWithBackoff(fn, 3, 0)).rejects.toThrow("API error (500)");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
