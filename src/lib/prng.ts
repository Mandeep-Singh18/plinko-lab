
/**
 * A simple xorshift32 deterministic pseudo-random number generator.
 * The state must be initialized with a non-zero number.
 */
export class XorShift32 {
  private state: number;

  constructor(seedU32: number) {
    this.state = seedU32 >>> 0;
    if (this.state === 0) {
      this.state = 0xdeadbeef; // Must not be 0
    }
  }

  /**
   * Returns the next 32-bit unsigned integer.
   */
  nextU32(): number {
    let x = this.state;
    x ^= (x << 13) >>> 0;
    x ^= (x >>> 17);
    x ^= (x << 5) >>> 0;
    this.state = x >>> 0;
    return this.state;
  }

  /**
   * Returns the next float in the range [0, 1).
   */
  nextFloat(): number {
    // 2^32
    return this.nextU32() / 4294967296;
  }
}