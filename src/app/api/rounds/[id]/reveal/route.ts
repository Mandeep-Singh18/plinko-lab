// src/app/api/rounds/[id]/reveal/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: roundId } = await params;
    
    // 1. Find the started round
    const round = await prisma.round.findUnique({
      where: { id: roundId },
    });

    if (!round || !round.serverSeed || round.status !== 'STARTED') {
      return new NextResponse('Round not found or not started', { status: 404 });
    }

    // 2. Update status and set revealedAt timestamp
    const updatedRound = await prisma.round.update({
      where: { id: roundId },
      data: {
        status: 'REVEALED',
        revealedAt: new Date(),
      },
    });

    // 3. Return the now-public serverSeed
    return NextResponse.json({
      serverSeed: updatedRound.serverSeed,
    });

  } catch (error) {
    console.error('Reveal error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}