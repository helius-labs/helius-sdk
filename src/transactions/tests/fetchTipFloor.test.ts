import { fetchTipFloor75th } from "../fetchTipFloor";

const g = global as any;

describe("fetchTipFloor75th Tests", () => {
  afterEach(jest.resetAllMocks);

  it("Returns the 75-percentile tip when payload is valid", async () => {
    g.fetch = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve([{ landed_tips_75th_percentile: 0.0013 }]),
    });

    expect(await fetchTipFloor75th()).toBe(0.0013);
  });

  it("Returns undefined on malformed payload", async () => {
    g.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ unexpected: true }),
    });

    expect(await fetchTipFloor75th()).toBeUndefined();
  });

  it("Returns undefined on network error", async () => {
    g.fetch = jest.fn().mockRejectedValue(new Error("boom"));
    expect(await fetchTipFloor75th()).toBeUndefined();
  });
});
