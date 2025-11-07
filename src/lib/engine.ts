import { sha256hex, seedFromHex } from "./fairness";
import { XorShift32 } from "./prng";

interface GenerateRoundParams {
  combinedSeedHex: string;
  rows?: number;
  dropColumn: number;
}

interface RoundResult {
  pegMapHash: string;
  path: ("L" | "R")[];
  binIndex: number;
  pegMap: number[][]; // We return this for the verifier page
}

/**
 * Rounds a number to 6 decimal places.
 */
function round6(val: number): number {
  return Math.round(val * 1e6) / 1e6;
}

/**
 * Clamps a number between 0 and 1.
 */
function clamp(val: number): number {
  return Math.max(0, Math.min(1, val));
}

/**
 * Generates a deterministic Plinko round result based on a combined seed.
 */
export function generateRound({
  combinedSeedHex,
  rows = 12,
  dropColumn,
}: GenerateRoundParams): RoundResult {

  // 1. Initialize the PRNG from the combined seed
  const seedU32 = seedFromHex(combinedSeedHex);
  const rng = new XorShift32(seedU32);

  // 2. Phase 1: Generate the Peg Map
  // This consumes the first set of numbers from the PRNG stream.
  const pegMap: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    // Row 'r' has 'r + 1' pegs
    for (let p = 0; p < r + 1; p++) {
      const rand = rng.nextFloat();
      // Formula: leftBias = 0.5 + (rand() - 0.5) * 0.2
      let leftBias = 0.5 + (rand - 0.5) * 0.2;
      row.push(round6(leftBias));
    }
    pegMap.push(row);
  }

  // 3. Compute the pegMapHash
  const pegMapHash = sha256hex(JSON.stringify(pegMap));

  // 4. Phase 2: Generate the Ball Path
  // We *continue* using the same PRNG stream.
  let pos = 0; // Number of "Right" moves
  const path: ("L" | "R")[] = [];

  // Calculate the drop column adjustment
  // adj = (dropColumn - floor(R/2)) * 0.01
  const adj = (dropColumn - Math.floor(rows / 2)) * 0.01;

  for (let r = 0; r < rows; r++) {
    // Get the peg the ball is currently on
    // index = min(pos, r)
    const pegIndex = Math.min(pos, r);
    const baseBias = pegMap[r][pegIndex];

    // Calculate final bias with adjustment and clamp
    // bias' = clamp(leftBias + adj, 0, 1)
    const bias = clamp(baseBias + adj);

    // Draw the next random number for the decision
    const rnd = rng.nextFloat();

    if (rnd < bias) {
      path.push("L");
      // pos stays the same
    } else {
      path.push("R");
      pos += 1; // Move right
    }
  }

  // 5. Final bin is the total number of "Right" moves
  const binIndex = pos;

  return {
    pegMap,
    pegMapHash,
    path,
    binIndex,
  };
}