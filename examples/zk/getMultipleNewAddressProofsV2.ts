import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const candidates = [
    { address: "your_address_1", tree: "your_tree_1" },
    { address: "your_address_2", tree: "your_tree_2" },
  ];

  const { value } = await helius.zk.getMultipleNewAddressProofsV2(candidates);

  value.forEach((p) =>
    console.log(
      p.address,
      "nextIndex→",
      p.nextIndex,
      "isFree→",
      p.proof.length === 0,
    ),
  );
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();


(async () => {
  const apiKey = "3a4c1aff-f2ac-48a3-b9ca-65814a7bbeb7";
  const helius = createHelius({ apiKey });

  try {
  const candidates = [
    { address: "ARDPkhymCbfdan375FCgPnBJQvUfHeb7nHVdBfwWSxrp", tree: "ARDPkhymCbfdan375FCgPnBJQvUfHeb7nHVdBfwWSxrp" },
  ];

  const { value } = await helius.zk.getMultipleNewAddressProofsV2(candidates);

  value.forEach((p) =>
    console.log(
      p.address,
      "nextIndex→",
      p.nextIndex,
      "isFree→",
      p.proof.length === 0,
    ),
  );
  } catch (error) {
    console.error("Error:", error);
  }
})();