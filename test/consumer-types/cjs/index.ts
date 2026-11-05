// Typechecked as a CommonJS consumer of the built package. Each expected
// error below goes unused, failing the check, if the SDK's declarations stop
// resolving and its types silently become `any`.
import { createHelius } from "helius-sdk";
import type { GetAssetResponseList } from "helius-sdk/types/das";
import { makeParsedStreamsClient } from "helius-sdk/websockets/parsedStreams";

const helius = createHelius({ apiKey: "x" });

export const check = async () => {
  const assets: GetAssetResponseList = await helius.getAssetsByOwner({
    ownerAddress: "x",
  });

  // @ts-expect-error A DAS result is not a number
  const wrongResult: number = await helius.getAssetsByOwner({
    ownerAddress: "x",
  });

  // @ts-expect-error A lazy namespace is not a number
  const wrongNamespace: number = helius.parsedEvents;

  // @ts-expect-error A subpath export is typed too
  const wrongSubpath: number = makeParsedStreamsClient("x");

  return [assets, wrongResult, wrongNamespace, wrongSubpath];
};
