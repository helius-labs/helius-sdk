import { determineTipSol } from "../determineTip";
import { makeSendTransactionWithSender } from "../sendTransactionWithSender";
import { MIN_TIP_LAMPORTS_DUAL, MIN_TIP_LAMPORTS_SWQOS } from "../types";

const mockCreateSmartTxWithTip = jest.fn();
const mockSendViaSender = jest.fn();
const mockPoll = jest.fn();

jest.mock("../sendViaSender", () => ({
  sendViaSender: (...args: any[]) => mockSendViaSender(...args),
}));
jest.mock("../pollTransactionConfirmation", () => ({
  makePollTransactionConfirmation: () => () => mockPoll(),
}));
jest.mock("@solana/kit", () => {
  const actual = jest.requireActual("@solana/kit");
  return {
    ...actual,
    getBase64EncodedWireTransaction: () => "TX64",
  };
});
jest.mock("../determineTip", () => ({
  determineTipSol: jest.fn().mockResolvedValue(1n), // Way below any floor
}));

describe("makeSendTransactionWithSender Tests", () => {
  const dummyRpc: any = {};
  const signed = {};
  const lifetime = { lastValidBlockHeight: 999n } as any;

  beforeEach(() => {
    jest.resetAllMocks();
    (determineTipSol as jest.MockedFunction<typeof determineTipSol>).mockResolvedValue(1n);
    mockCreateSmartTxWithTip.mockResolvedValue({ signed, lifetime });
    mockSendViaSender.mockResolvedValue("sig-123");
  });

  it("Applies dual-route tip floor", async () => {
    const { send } = makeSendTransactionWithSender({
      raw: dummyRpc,
      createSmartTransactionWithTip: mockCreateSmartTxWithTip,
    });

    await send({
      region: "Default",
      swqosOnly: false,
      signers: [],
      instructions: [],
      version: 0,
    } as any);

    expect(mockCreateSmartTxWithTip).toHaveBeenCalledWith(
      expect.objectContaining({ tipAmount: Number(MIN_TIP_LAMPORTS_DUAL) })
    );
    expect(mockSendViaSender).toHaveBeenCalledWith("TX64", "Default", false);
    expect(mockPoll).toHaveBeenCalled();
  });

  it("Applies SWQoS tip floor", async () => {
    const { send } = makeSendTransactionWithSender({
      raw: dummyRpc,
      createSmartTransactionWithTip: mockCreateSmartTxWithTip,
    });

    await send({
      region: "US_EAST",
      swqosOnly: true,
      signers: [],
      instructions: [],
      version: 0,
    } as any);

    expect(mockCreateSmartTxWithTip).toHaveBeenCalledWith(
      expect.objectContaining({ tipAmount: Number(MIN_TIP_LAMPORTS_SWQOS) })
    );
    expect(mockSendViaSender).toHaveBeenCalledWith("TX64", "US_EAST", true);
  });
});
