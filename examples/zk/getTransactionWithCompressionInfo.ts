import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const sig =
      "3uyp4tATyJ2Ks4TJxYRLi8RfmgP1Xd2YCsRh9V5fYtrRVp1Fn6D2iRqfaiSL2NdrGwi7squdw8SFoj25Y1AufjuE";
    const res = await helius.zk.getTransactionWithCompressionInfo({
      signature: sig,
    });

    console.log(`${JSON.stringify(res, null, 2)}`);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
