import { createHelius } from '../../rpc';

describe('Enhanced Lazy Namespace Test', () => {
  it('Exposes functions lazily', async () => {
    const helius = createHelius({ apiKey: 'test' });
    expect(typeof helius.enhanced.getTransactions).toBe('function');
  });
});
