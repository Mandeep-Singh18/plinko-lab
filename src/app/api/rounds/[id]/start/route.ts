// src/app/api/rounds/[id]/start/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sha256hex } from '@/lib/fairness';
import { generateRound } from '@/lib/engine';
import { z } from 'zod'; // Using zod for validation

const prisma = new PrismaClient();

// Define a schema for the request body
const startSchema = z.object({
  clientSeed: z.string().min(1, "clientSeed is required"),
  dropColumn: z.number().min(0).max(12),
  betCents: z.number().min(0),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: roundId } = await params;
    
    // 1. Validate the request body
    const body = await request.json();
    const validation = startSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(JSON.stringify(validation.error), { status: 400 });
    }
    const { clientSeed, dropColumn, betCents } = validation.data;

    // 2. Find the round created by /commit
    const round = await prisma.round.findUnique({
      where: { id: roundId },
    });

    if (!round || !round.serverSeed || round.status !== 'CREATED') {
      return new NextResponse('Round not found or already started', { status: 404 });
    }

    // 3. Compute the combinedSeed
    const combinedSeed = sha256hex(
      `${round.serverSeed}:${clientSeed}:${round.nonce}`
    );

    // 4. Run the deterministic engine
    const result = generateRound({
      combinedSeedHex: combinedSeed,
      rows: round.rows,
      dropColumn: dropColumn,
    });

    // 5. Update the round in the DB
    const updatedRound = await prisma.round.update({
      where: { id: roundId },
      data: {
        clientSeed: clientSeed,
        dropColumn: dropColumn,
        betCents: betCents,
        combinedSeed: combinedSeed,
        pegMapHash: result.pegMapHash,
        binIndex: result.binIndex,
        pathJson: result.path as any, // Prisma can store this as JSON
        status: 'STARTED',
        // Payout logic would go here. We'll use a placeholder.
        payoutMultiplier: 1.0, 
      },
    });

    // 6. Return the public results (NOT the serverSeed)
    return NextResponse.json({
      roundId: updatedRound.id,
      pegMapHash: updatedRound.pegMapHash,
      binIndex: updatedRound.binIndex,
      path: result.path,
    });

  } catch (error) {
    console.error('Start error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}