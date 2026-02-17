import { getCheckoutPreview } from "../checkout";
import { authRequest } from "../utils";

jest.mock("../utils");

const mockAuthRequest = authRequest as jest.MockedFunction<typeof authRequest>;

describe("getCheckoutPreview", () => {
  beforeEach(() => jest.resetAllMocks());

  it("fetches preview with all params", async () => {
    const mockPreview = {
      planName: "Business",
      period: "monthly",
      baseAmount: 49900,
      subtotal: 49900,
      appliedCredits: 0,
      proratedCredits: 2500,
      discounts: 5000,
      dueToday: 42400,
      destinationWallet: "Treasury111",
      note: "Prorated for remaining billing cycle",
      coupon: { code: "SAVE10", valid: true, percentOff: 10, description: "10% off" },
    };
    mockAuthRequest.mockResolvedValue(mockPreview);

    const result = await getCheckoutPreview("jwt", "price_123", "proj-1", "SAVE10", "agent");

    expect(result.planName).toBe("Business");
    expect(result.dueToday).toBe(42400);
    expect(result.coupon?.valid).toBe(true);
    expect(result.proratedCredits).toBe(2500);
  });

  it("works without coupon code", async () => {
    mockAuthRequest.mockResolvedValue({
      planName: "Developer",
      period: "monthly",
      baseAmount: 4900,
      subtotal: 4900,
      appliedCredits: 0,
      proratedCredits: 0,
      discounts: 0,
      dueToday: 4900,
      destinationWallet: "Treasury111",
      note: "",
    });

    const result = await getCheckoutPreview("jwt", "price_123", "proj-1");

    expect(mockAuthRequest).toHaveBeenCalledWith(
      "/checkout/preview?priceId=price_123&refId=proj-1",
      expect.any(Object),
      undefined
    );
    expect(result.dueToday).toBe(4900);
  });
});
