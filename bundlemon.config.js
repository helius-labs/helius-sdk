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
      // fetchStripePriceIds, fetchPrepaidCreditsPriceIds). The absolute
      // cap still gates unbounded growth.
      path: 'dist/esm/auth/devPortalConfigs.js',
      maxSize: '1kb',
    },
    {
      // Lazy-loaded HeliusClient entry point: every new defineLazyMethod
      // adds ~50B gzipped. Bumped after getTransfersByAddress (#313) put
      // the file at 2.55KB.
      path: 'dist/esm/rpc/index.js',
      maxSize: '2.6kb',
    },
    {
      // Aggregator for every checkout primitive: resolvePriceId,
      // initializeCheckout, getCheckoutPreview, getCheckoutPreviewByPriceId,
      // getPaymentIntent, getPaymentStatus, pollCheckoutCompletion.
      path: 'dist/esm/auth/checkout.js',
      maxSize: '1.7kb',
    },
    {
      // Opt out of the default 15% growth ratchet: this PR adds the
      // HELIUS_API_URL env override (resolveApiUrl + /v0 auto-append) and
      // structured JSON-error parsing. The absolute cap still gates growth.
      path: 'dist/esm/auth/utils.js',
      maxSize: '1.5kb',
    },
    {
      // Opt out of the default 15% growth ratchet: getHttpStatus now prefers
      // a structured `status` property before falling back to message parsing.
      path: 'dist/esm/auth/getHttpStatus.js',
      maxSize: '1kb',
    },
    {
      path: 'dist/esm/websockets/wsAsync.js',
      maxSize: '1.5kb',
    },
    {
      // Standalone Pre Confirmations WS client: subscribe/unsubscribe over a
      // demuxed text+binary socket, keepalive, bounded buffer, plus the binary
      // frame decoder (decodePreconfFrame) and bincode VersionedTransaction
      // decode. Self-contained (does not reuse enhancedWs), so it lands at
      // ~3.9KB. The absolute cap still gates unbounded growth.
      path: 'dist/esm/websockets/preconfWs.js',
      maxSize: '4kb',
    },
    {
      // Opt out of the default 15% growth ratchet: Sender Max pricing adds
      // MIN_TIP_LAMPORTS_MAX + deprecated MIN_TIP_LAMPORTS_DUAL alias and the
      // corrected SWQOS floor. Absolute cap still gates unbounded growth.
      path: 'dist/esm/transactions/types.js',
      maxSize: '2.5kb',
    },
    {
      // Opt out of the default 15% growth ratchet: determineTipSol now branches
      // on the Sender Max vs SWQOS-only floor. Absolute cap still gates growth.
      path: 'dist/esm/transactions/determineTip.js',
      maxSize: '2.5kb',
    },
    {
      path: 'dist/**/*.js',
      maxSize: '2.5kb',  // No file should be larger than 2.5kb
      maxPercentIncrease: 15
    }
  ]
};
