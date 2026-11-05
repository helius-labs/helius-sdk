const mockBuildAndSend = jest.fn();
jest.mock("../buildTokenTransfer.js", () => ({
  buildAndSendTokenTransfer: mockBuildAndSend,
}));

import { payUSDC } from "../payUSDC.js";

describe("payUSDC", () => {
  it("throws without sending any funds", async () => {
    await expect(payUSDC(new Uint8Array(64))).rejects.toThrow(
      /no longer supported/
    );
    expect(mockBuildAndSend).not.toHaveBeenCalled();
  });
});
