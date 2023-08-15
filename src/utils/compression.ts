import {
  ChangeLogEventV1,
  deserializeChangeLogEventV1,
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createCreateTreeInstruction,
  createMintToCollectionV1Instruction,
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  TokenProgramVersion,
  createMintV1Instruction,
} from "@metaplex-foundation/mpl-bubblegum";
import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
  createCreateMasterEditionV3Instruction,
  createSetCollectionSizeInstruction,
} from "@metaplex-foundation/mpl-token-metadata";
import { BN } from "@project-serum/anchor";
import {
  createAccount,
  mintTo,
  createMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { RequiredMetadataArgs } from "../types";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";

// Creates a new merkle tree for compression.
export const initTree = async (
  connection: Connection,
  payerKeypair: Keypair,
  treeKeypair: any,
  maxDepth: number = 14,
  maxBufferSize: number = 64
) => {
  
  const payer = payerKeypair.publicKey;
  const space = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize);
  const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
    [treeKeypair.publicKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  );
  const allocTreeIx = SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: treeKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(space),
    space: space,
    programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  });
  const createTreeIx = createCreateTreeInstruction(
    {
      merkleTree: treeKeypair.publicKey,
      treeAuthority,
      treeCreator: payer,
      payer,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    },
    {
      maxBufferSize,
      maxDepth,
      public: false,
    },
    BUBBLEGUM_PROGRAM_ID
  );
  let tx = new Transaction().add(allocTreeIx).add(createTreeIx);
  tx.feePayer = payer;
  try {
    await sendAndConfirmTransaction(
      connection,
      tx,
      [treeKeypair, payerKeypair],
      {
        commitment: "confirmed",
        skipPreflight: true,
      }
    );
  } catch (e) {
    console.error("Failed to create merkle tree: ", e);
    throw e;
  }
};

// Creates a metaplex collection NFT
export const initCollection = async (
  connection: Connection,
  ownerKeypair: Keypair,
  collectionName: string,
  collectionSymbol: string,
  collectionUri: string
) => {
  const cmintKey = Keypair.generate();
  const collectionMint = await createMint(
    connection,
    ownerKeypair,
    ownerKeypair.publicKey,
    ownerKeypair.publicKey,
    0,
    cmintKey,
    { commitment: "finalized" },
    TOKEN_PROGRAM_ID
  );
  const collectionTokenAccount = await createAccount(
    connection,
    ownerKeypair,
    collectionMint,
    ownerKeypair.publicKey,
    undefined,
    { commitment: "finalized" },
    TOKEN_PROGRAM_ID
  );
  await mintTo(
    connection,
    ownerKeypair,
    collectionMint,
    collectionTokenAccount,
    ownerKeypair,
    1,
    [],
    { commitment: "finalized" }
  );
  const [collectionMetadataAccount, _b] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      collectionMint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  const collectionMeatadataIX = createCreateMetadataAccountV3Instruction(
    {
      metadata: collectionMetadataAccount,
      mint: collectionMint,
      mintAuthority: ownerKeypair.publicKey,
      payer: ownerKeypair.publicKey,
      updateAuthority: ownerKeypair.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: collectionName,
          symbol: collectionSymbol,
          uri: collectionUri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: false,
        collectionDetails: null,
      },
    }
  );
  const [collectionMasterEditionAccount, _b2] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata", "utf8"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer(),
        Buffer.from("edition", "utf8"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
  const collectionMasterEditionIX = createCreateMasterEditionV3Instruction(
    {
      edition: collectionMasterEditionAccount,
      mint: collectionMint,
      mintAuthority: ownerKeypair.publicKey,
      payer: ownerKeypair.publicKey,
      updateAuthority: ownerKeypair.publicKey,
      metadata: collectionMetadataAccount,
    },
    {
      createMasterEditionArgs: {
        maxSupply: 0,
      },
    }
  );

  const sizeCollectionIX = createSetCollectionSizeInstruction(
    {
      collectionMetadata: collectionMetadataAccount,
      collectionAuthority: ownerKeypair.publicKey,
      collectionMint: collectionMint,
    },
    {
      setCollectionSizeArgs: { size: 50 },
    }
  );

  let tx = new Transaction()
    .add(collectionMeatadataIX)
    .add(collectionMasterEditionIX)
    .add(sizeCollectionIX);
  try {
    await sendAndConfirmTransaction(connection, tx, [ownerKeypair], {
      commitment: "confirmed",
      skipPreflight: true,
    });
    return {
      collectionMint,
      collectionMetadataAccount,
      collectionMasterEditionAccount,
    };
  } catch (e) {
    console.error("Failed to init collection: ", e);
    throw e;
  }
};

export const existingCollection = async (collectionMint: PublicKey) => {
  // Then, before calling mintCompressedNft:
  const [collectionMetadataAccount, _b] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      collectionMint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  const [collectionMasterEditionAccount, _b2] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata", "utf8"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer(),
        Buffer.from("edition", "utf8"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
  return { collectionMasterEditionAccount, collectionMetadataAccount };
};
export function loadWallet(kFile: string): Keypair {
  const fs = require("fs");
  return Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(kFile).toString()))
  );
}

// Minting with collection
export const mintCollectionCompressedNft = async (
  connection: Connection,
  nftArgs: RequiredMetadataArgs,
  ownerKeypairFile: Keypair,
  treeKeypair: any,
  collectionMint: PublicKey,
  collectionMetadata: PublicKey,
  collectionMasterEditionAccount: PublicKey
) => {
  const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
    [treeKeypair.publicKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  );
  const [bgumSigner, __] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_cpi", "utf8")],
    BUBBLEGUM_PROGRAM_ID
  );
  const defaultMetadataArgs = {
    creators: [],
    editionNonce: 0,
    tokenProgramVersion: TokenProgramVersion.Original,
    tokenStandard: null,
    uses: null,
    collection: null,
    primarySaleHappened: false,
    sellerFeeBasisPoints: 0,
    isMutable: false,
  };
  const mintIx = createMintToCollectionV1Instruction(
    {
      merkleTree: treeKeypair.publicKey,
      treeAuthority,
      treeDelegate: ownerKeypairFile.publicKey,
      payer: ownerKeypairFile.publicKey,
      leafDelegate: ownerKeypairFile.publicKey,
      leafOwner: ownerKeypairFile.publicKey,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      collectionAuthority: ownerKeypairFile.publicKey,
      collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID,
      collectionMint: collectionMint,
      collectionMetadata: collectionMetadata,
      editionAccount: collectionMasterEditionAccount,
      bubblegumSigner: bgumSigner,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    },
    {
      metadataArgs: Object.assign({}, nftArgs, defaultMetadataArgs, {
        collection: { key: collectionMint, verified: false },
      }),
    }
  );
  const tx = new Transaction().add(mintIx);
  tx.feePayer = ownerKeypairFile.publicKey;
  try {
    const sig = await sendAndConfirmTransaction(
      connection,
      tx,
      [ownerKeypairFile],
      {
        commitment: "confirmed",
        skipPreflight: true,
      }
    );
    return sig;
  } catch (e) {
    console.error("Failed to mint compressed NFT", e);
    throw e;
  }
};

// Minting without collection
export const mintCompressedNFT = async (
  connection: Connection,
  nftArgs: RequiredMetadataArgs,
  ownerKeypairFile: Keypair,
  treeKeypair: Keypair
) => {
  const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
    [treeKeypair.publicKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  );
  const defaultMetadataArgs = {
    creators: [],
    editionNonce: 0,
    tokenProgramVersion: TokenProgramVersion.Original,
    tokenStandard: null,
    uses: null,
    collection: null,
    primarySaleHappened: false,
    sellerFeeBasisPoints: 0,
    isMutable: false,
  };
  const mintIx = createMintV1Instruction(
    {
      merkleTree: treeKeypair.publicKey,
      treeAuthority,
      treeDelegate: ownerKeypairFile.publicKey,
      payer: ownerKeypairFile.publicKey,
      leafDelegate: ownerKeypairFile.publicKey,
      leafOwner: ownerKeypairFile.publicKey,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      logWrapper: SPL_NOOP_PROGRAM_ID,
    },
    {
      message: Object.assign({}, nftArgs, defaultMetadataArgs, {
        collection: null,
      }),
    }
  );
  const tx = new Transaction().add(mintIx);
  tx.feePayer = ownerKeypairFile.publicKey;
  try {
    const sig = await sendAndConfirmTransaction(
      connection,
      tx,
      [ownerKeypairFile],
      {
        commitment: "confirmed",
        skipPreflight: true,
      }
    );
    return sig;
  } catch (e) {
    return e;
  }
};

export const getAssetID = async (
  connection: string,
  address: PublicKey,
  signature: string | unknown,
  noop = SPL_NOOP_PROGRAM_ID
) => {
  const wallet = new PublicKey(address);
  const conn = new Connection(connection, "confirmed");
  let firstIndex;
  const tx = await conn.getTransaction(signature as string);
  const changeLogs: ChangeLogEventV1[] = [];
  tx?.meta?.innerInstructions?.forEach((compiledIx) => {
    compiledIx.instructions.forEach((innerIx) => {
      const accountKeys = tx?.transaction.message.accountKeys;
      if (noop.toBase58() !== accountKeys[innerIx.programIdIndex].toBase58())
        return;
      try {
        changeLogs.push(
          deserializeChangeLogEventV1(Buffer.from(bs58.decode(innerIx.data)))
        );
        firstIndex = changeLogs[0]?.index;
      } catch (__) {}
    });
  });
  // Index for NFT just minted.
  const node = new BN.BN(firstIndex);
  // Return asset ID for asset just minted.
  const [assetId] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("asset", "utf8"),
      wallet.toBuffer(),
      Uint8Array.from(node.toArray("le", 8)),
    ],
    BUBBLEGUM_PROGRAM_ID
  );
  const id = assetId.toBase58();

  return {
    id,
  };
};
