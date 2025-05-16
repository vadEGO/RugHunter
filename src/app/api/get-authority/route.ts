
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import { Metadata, PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const METADATA_PROGRAM_PUBKEY = new PublicKey(METADATA_PROGRAM_ID.toString());


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mintAddress = searchParams.get('mintAddress');

  if (!mintAddress) {
    return NextResponse.json({ error: 'mintAddress query parameter is required' }, { status: 400 });
  }

  let mintPublicKey: PublicKey;
  try {
    mintPublicKey = new PublicKey(mintAddress);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid mintAddress format' }, { status: 400 });
  }

  const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

  try {
    // 1. Try to fetch Metaplex Metadata (for NFTs/Metaplex-managed tokens)
    const metadataPDA = await PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_PUBKEY.toBuffer(),
        mintPublicKey.toBuffer(),
      ],
      METADATA_PROGRAM_PUBKEY
    );
    const metadataAccountInfo = await connection.getAccountInfo(metadataPDA[0]);

    if (metadataAccountInfo && metadataAccountInfo.data) {
      try {
        const [metadata] = Metadata.deserialize(metadataAccountInfo.data);
        if (metadata && metadata.updateAuthority) {
          return NextResponse.json({
            mintAddress: mintAddress,
            authorityType: 'updateAuthority',
            authority: metadata.updateAuthority.toString(),
          });
        }
      } catch (deserializeError) {
        // Could be a non-Metaplex account at that PDA, or data is not Metaplex metadata
        // console.warn(`Failed to deserialize Metaplex metadata for ${mintAddress}:`, deserializeError);
        // Fall through to check as a regular SPL token
      }
    }

    // 2. If not Metaplex or deserialization failed, try to fetch as a standard SPL Mint
    try {
      const mintInfo = await getMint(connection, mintPublicKey);
      return NextResponse.json({
        mintAddress: mintAddress,
        authorityType: 'mintAuthority',
        authority: mintInfo.mintAuthority ? mintInfo.mintAuthority.toString() : null,
      });
    } catch (splTokenError: any) {
      // console.error(`Failed to get SPL token mint info for ${mintAddress}:`, splTokenError);
      if (splTokenError.message?.includes('could not find account') || splTokenError.message?.includes('Account does not exist')) {
        return NextResponse.json({ error: `Mint account not found for address: ${mintAddress}` }, { status: 404 });
      }
      return NextResponse.json({ error: `Error fetching SPL token info: ${splTokenError.message}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error(`Error processing authority request for ${mintAddress}:`, error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
  }
}
