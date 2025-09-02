import { Helius } from "../src";
import axios from 'axios';
import { DAS } from '../src/types';

// Mock axios directly
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Helius SDK Tests", () => {
  let helius: Helius;
  const apiKey = "fake-api-key";

  beforeEach(() => {
    // Initialize the SDK instance
    helius = new Helius(apiKey, "mainnet-beta");
  });

  it("Should fetch all webhooks correctly", async () => {
    // Setup the mock response
    const mockWebhooks = {
      data: [
        { id: "1", name: "Webhook 1" },
        { id: "2", name: "Webhook 2" },
      ]
    };

    // Mock axios.get to resolve with the mock webhooks
    mockedAxios.get.mockResolvedValueOnce(mockWebhooks);

    // Call the function
    const webhooks = await helius.getAllWebhooks();

    // Validate
    expect(mockedAxios.get).toHaveBeenCalledWith(`${helius.getApiEndpoint("/v0/webhooks")}`);
    expect(webhooks).toEqual(mockWebhooks.data);
  });

  it("Should handle errors when fetching all webhooks", async () => {
    // Simulate axios.get promise rejection
    const error = new Error('Network error');
    mockedAxios.get.mockRejectedValueOnce(error);

    // Expect the getAllWebhooks method to throw
    await expect(helius.getAllWebhooks()).rejects.toThrow('Network error');
  });

  it("Should properly type TokenAccountExtensions", () => {
    // Test that our new types compile and work correctly
    const mockTokenAccount: DAS.TokenAccounts = {
      address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      owner: "11111111111111111111111111111112",
      amount: 100,
      delegated_amount: 0,
      frozen: false,
      token_extensions: {
        immutable_owner: true,
        required_memo_on_transfer: {
          enabled: true,
          memo_program_id: "MemoSq4gqABAXKb96qnH8TysNcWrMygqX2"
        },
        cpi_guard: {
          enabled: true,
          allowed_programs: ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"]
        },
        confidential_transfer_account: {
          approved: true,
          elgamal_pubkey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
          pending_balance_lo: "0",
          pending_balance_hi: "0",
          available_balance: "100",
          decryptable_available_balance: "100",
          allow_confidential_credits: true,
          allow_non_confidential_credits: true,
          pending_balance_credit_counter: 0,
          maximum_pending_balance_credit_counter: 0,
          expected_pending_balance_credit_counter: 0,
          actual_pending_balance_credit_counter: 0
        },
        transfer_fee_account: {
          transfer_fee_config_authority: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
          withdraw_withheld_authority: "11111111111111111111111111111112",
          withheld_amount: 50,
          older_transfer_fee: { epoch: "1", maximum_fee: "100", transfer_fee_basis_points: "500" },
          newer_transfer_fee: { epoch: "2" }
        },
        // Test unknown extension
        unknown_extension: "some value"
      }
    };

    // Verify the type works
    expect(mockTokenAccount.token_extensions).toBeDefined();
    expect(mockTokenAccount.token_extensions.immutable_owner).toBe(true);
    expect(mockTokenAccount.token_extensions.required_memo_on_transfer?.enabled).toBe(true);
    expect(mockTokenAccount.token_extensions.cpi_guard?.enabled).toBe(true);
    expect(mockTokenAccount.token_extensions.confidential_transfer_account).toBeDefined();
    expect(mockTokenAccount.token_extensions.transfer_fee_account).toBeDefined();
    expect(mockTokenAccount.token_extensions.unknown_extension).toBe("some value");
  });
});
