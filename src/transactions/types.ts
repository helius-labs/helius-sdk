export interface GetComputeUnitsOpts {
  // The floor for very small transactions. We default to 1k
  min?: number;
  // The buffer applied on top of simulated CU. We default to 10%
  bufferPct?: number;
};