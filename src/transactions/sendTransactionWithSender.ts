import { getBase64EncodedWireTransaction } from "@solana/kit";
import { makePollTransactionConfirmation } from "./pollTransactionConfirmation";
import {
  MIN_TIP_LAMPORTS_DUAL,
  MIN_TIP_LAMPORTS_SWQOS,
  type SendTransactionWithSenderFn,
  type SendSmartTxSenderDeps,
} from "./types";
import { sendViaSender } from "./sendViaSender";
import { determineTipSol } from "./determineTip";

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_POLL_MS = 2_000;

export const makeSendTransactionWithSender = (deps: SendSmartTxSenderDeps) => {
  const { raw, createSmartTransactionWithTip } = deps;
  const poll = makePollTransactionConfirmation(raw);

  const send: SendTransactionWithSenderFn = async ({
    region,
    swqosOnly = false,
    pollTimeoutMs = DEFAULT_TIMEOUT_MS,
    pollIntervalMs = DEFAULT_POLL_MS,
    tipAmount,
    ...builderArgs
  }) => {
    if (!region) throw new Error("Sender region must be specified");

    let tipLamports =
      tipAmount != null ? BigInt(tipAmount) : await determineTipSol(swqosOnly);

    const floor = swqosOnly ? MIN_TIP_LAMPORTS_SWQOS : MIN_TIP_LAMPORTS_DUAL;
    if (tipLamports < floor) tipLamports = floor;

    const { signed, lifetime } = await createSmartTransactionWithTip({
      ...builderArgs,
      tipAmount: Number(tipLamports),
    });

    const sig = await sendViaSender(
      getBase64EncodedWireTransaction(signed),
      region,
      swqosOnly
    );

    await poll(sig, {
      timeout: pollTimeoutMs,
      interval: pollIntervalMs,
      lastValidBlockHeight: lifetime.lastValidBlockHeight,
    });

    return sig;
  };

  return { send };
};
