import { NextResponse } from 'next/server';
import { sha256hex } from '@/lib/fairness';
import { generateRound } from '@/lib/engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Get all required params from the URL
    const serverSeed = searchParams.get('serverSeed');
    const clientSeed = searchParams.get('clientSeed');
    const nonce = searchParams.get('nonce');
    const dropColumnStr = searchParams.get('dropColumn');

    if (!serverSeed || !clientSeed || !nonce || !dropColumnStr) {
      return new NextResponse('Missing query parameters', { status: 400 });
    }

    const dropColumn = parseInt(dropColumnStr, 10);
    if (isNaN(dropColumn) || dropColumn < 0 || dropColumn > 12) {
      return new NextResponse('Invalid dropColumn', { status: 400 });
    }

    // 2. Re-compute commitHex
    const commitHex = sha256hex(`${serverSeed}:${nonce}`);

    // 3. Re-compute combinedSeed
    const combinedSeed = sha256hex(`${serverSeed}:${clientSeed}:${nonce}`);

    // 4. Re-run the deterministic engine
    const result = generateRound({
      combinedSeedHex: combinedSeed,
      rows: 12, // Standard
      dropColumn: dropColumn,
    });

    // 5. Return all computed values for verification
    return NextResponse.json({
      commitHex,
      combinedSeed,
      pegMapHash: result.pegMapHash,
      binIndex: result.binIndex,
      path: result.path,
    });

  } catch (error) {
    console.error('Verify error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}