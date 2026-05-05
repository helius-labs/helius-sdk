import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const address = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
  const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  try {
    console.log("\nExample 1: Get Recent Transfers");
    const recent = await helius.getTransfersByAddress([
      address,
      {
        limit: 5,
        sortOrder: "desc",
      },
    ]);

    console.log(`Found ${recent.data.length} transfers`);
    recent.data.forEach((transfer, i) => {
      console.log(`${i + 1}. ${transfer.uiAmount} of ${transfer.mint}`);
      console.log(
        `   ${transfer.fromUserAccount ?? "mint"} -> ${transfer.toUserAccount ?? "burn"}`
      );
      console.log(`   Signature: ${transfer.signature}`);
    });

    if (recent.paginationToken) {
      console.log(`\nPagination token: ${recent.paginationToken}`);
    }

    console.log("\nExample 2: Filter by Mint and Direction");
    const inboundUsdc = await helius.getTransfersByAddress([
      address,
      {
        mint: usdcMint,
        direction: "in",
        limit: 10,
      },
    ]);

    console.log(`Found ${inboundUsdc.data.length} inbound USDC transfers`);
    inboundUsdc.data.forEach((transfer, i) => {
      console.log(
        `${i + 1}. ${transfer.uiAmount} USDC from ${transfer.fromUserAccount}`
      );
    });

    console.log("\nExample 3: Filter by Counterparty and Time");
    const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    const counterpartyTransfers = await helius.getTransfersByAddress([
      address,
      {
        with: "7hPhaUpydpvm8wtiS3k4LPZKUmivQRs7YQmpE1hFshHx",
        limit: 10,
        filters: {
          blockTime: { gte: oneDayAgo },
        },
      },
    ]);

    console.log(
      `Found ${counterpartyTransfers.data.length} transfers with counterparty`
    );

    console.log("\nExample 4: Pagination");
    const page1 = await helius.getTransfersByAddress([address, { limit: 5 }]);

    console.log(`Page 1: ${page1.data.length} transfers`);
    if (page1.paginationToken) {
      const page2 = await helius.getTransfersByAddress([
        address,
        {
          limit: 5,
          paginationToken: page1.paginationToken,
        },
      ]);

      console.log(`Page 2: ${page2.data.length} transfers`);
    }
  } catch (error) {
    console.error("Error running examples:", error);
  }
})();
