/** @type {import('bundlemon').Config} */
export default {
  files: [
    {
      path: 'dist/rpc/index.js',           
      maxSize: '2kb',     
      maxPercentIncrease: 5
    },
    {
      path: 'dist/rpc/createHelius.eager.js',
      maxSize: '1.5kb',
      maxPercentIncrease: 5
    },
    {
      path: 'dist/esm/auth/client.js',
      maxSize: '2.5kb',
    },
    {
      path: 'dist/esm/auth/constants.js',
      maxSize: '1.5kb',
    },
    {
      // Opt out of the default 15% growth ratchet: this module exposes a
      // small family of configs-fetch helpers (fetchDevPortalConfigs,
      // fetchStripePriceIds, fetchPrepaidCreditsPriceIds, and the
      // deprecated fetchOpenPayPriceIds wrapper). The absolute cap still
      // gates unbounded growth.
      path: 'dist/esm/auth/devPortalConfigs.js',
      maxSize: '2.5kb',
    },
    {
      path: 'dist/esm/rpc/index.js',
      maxSize: '2.52kb',
    },
    {
      // Aggregator for every checkout primitive: resolvePriceId,
      // initializeCheckout, getCheckoutPreview, getCheckoutPreviewByPriceId,
      // getPaymentIntent, getPaymentStatus, pollCheckoutCompletion, plus the
      // legacy executeCheckout/executeUpgrade/executeRenewal helpers and
      // toCheckoutResult. Phase 4 cleanup will delete the legacy execute*
      // helpers and this can drop back closer to 2KB.
      path: 'dist/esm/auth/checkout.js',
      maxSize: '2.7kb',
    },
    {
      path: 'dist/esm/websockets/wsAsync.js',
      maxSize: '1.5kb',
    },
    {
      path: 'dist/**/*.js',
      maxSize: '2.5kb',  // No file should be larger than 2.5kb
      maxPercentIncrease: 15
    }
  ]
};
