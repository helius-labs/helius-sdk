import { Helius } from "../src";
import axios from 'axios';

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
    const mockWebhooks = { data: [
      { id: "1", name: "Webhook 1" },
      { id: "2", name: "Webhook 2" },
    ]};

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
});
