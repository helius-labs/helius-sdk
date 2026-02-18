import { createHelius } from "helius-sdk";

const ESCROW_PROGRAM_ID = "YourEscrowProgram111111111111111111111111111";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const webhook = await helius.webhooks.create({
      webhookURL: "https://your-server.com/escrow-events",
      transactionTypes: ["ANY"],
      accountAddresses: [ESCROW_PROGRAM_ID],
      webhookType: "enhanced",
    });

    console.log("Webhook created:", webhook.webhookID);

    const escrowAccounts = [
      "EscrowPDA1111111111111111111111111111111111",
      "EscrowPDA2222222222222222222222222222222222",
    ];

    await helius.webhooks.update(webhook.webhookID, {
      accountAddresses: [ESCROW_PROGRAM_ID, ...escrowAccounts],
    });

    console.log("Added escrow accounts");
  } catch (error) {
    console.error("Error:", error);
  }
})();

