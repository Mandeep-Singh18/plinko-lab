import { describe, it, expect } from 'vitest';
import { sha256hex, seedFromHex } from '@/lib/fairness';
import { XorShift32 } from '@/lib/prng';
import { generateRound } from '@/lib/engine';

const TV = {
  rows: 12,
  serverSeed: "b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc",
  nonce: "42",
  clientSeed: "candidate-hello",
  
  // Derived values
  derived: {
    commitHex: "bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34",
    combinedSeed: "e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0",
    prng: [
      0.1106166649,
      0.7625129214,
      0.0439292176,
      0.4578678815,
      0.3438999297,
    ],
    pegMapRow0: [0.422123],
    pegMapRow1: [0.552503, 0.408786],
    pegMapRow2: [0.491574, 0.468780, 0.436540],
    
    // Path outcome
    centerDropIndex: 6,
  }
};
// ----------------------------------

describe('Provably-Fair Engine', () => {

  it('1. should compute the correct commitHex', () => {
    const commitHex = sha256hex(`${TV.serverSeed}:${TV.nonce}`);
    expect(commitHex).toBe(TV.derived.commitHex);
  });

  it('2. should compute the correct combinedSeed', () => {
    const combinedSeed = sha256hex(
      `${TV.serverSeed}:${TV.clientSeed}:${TV.nonce}`
    );
    expect(combinedSeed).toBe(TV.derived.combinedSeed);
  });

  it('3. should generate the correct PRNG sequence', () => {
    const seedU32 = seedFromHex(TV.derived.combinedSeed);
    const rng = new XorShift32(seedU32);

    // Check the first 5 floats
    for (const expectedFloat of TV.derived.prng) {
      // Use toBeCloseTo for float comparison
      expect(rng.nextFloat()).toBeCloseTo(expectedFloat, 9);
    }
  });

  it('4. should generate the correct peg map and final binIndex', () => {
    // Run the entire engine
    const result = generateRound({
      combinedSeedHex: TV.derived.combinedSeed,
      rows: TV.rows,
      dropColumn: 6, // Center drop
    });

    // Check peg map (as specified in PDF)
    expect(result.pegMap[0]).toEqual(TV.derived.pegMapRow0);
    expect(result.pegMap[1]).toEqual(TV.derived.pegMapRow1);
    expect(result.pegMap[2]).toEqual(TV.derived.pegMapRow2);

    // Check final bin index
    expect(result.binIndex).toBe(TV.derived.centerDropIndex);
  });

});