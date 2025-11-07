
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sha256hex, generateRandomSeed, generateNonce } from '@/lib/fairness';

const prisma = new PrismaClient();

/**
 * API route to create a new round "commitment".
 * This generates a serverSeed and nonce, computes the commitHex,
 * and stores it, returning only the public commitHex and roundId.
 */
export async function POST() {
  try {
    // 1. Generate server-side secrets
    const serverSeed = generateRandomSeed();
    const nonce = generateNonce();

    // 2. Create the public commitment [cite: 28]
    // Using ":" as a separator as shown in the spec [cite: 33]
    const commitHex = sha256hex(`${serverSeed}:${nonce}`);

    const newRound = await prisma.round.create({
      data: {
        serverSeed: serverSeed,
        nonce: nonce,
        commitHex: commitHex, 
        status: 'CREATED',
        rows: 12,
      },
    });

    return NextResponse.json({
      roundId: newRound.id,
      commitHex: newRound.commitHex,
      nonce: newRound.nonce
    });

  } catch (error) {
    console.error('Commit error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}