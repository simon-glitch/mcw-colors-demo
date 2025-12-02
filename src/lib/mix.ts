import { TypedArray, UintData, MakeData } from "./data";
import { colors_je, colors_be, color_index, MAX_DYES_PER_CRAFT, MAX_DYES_FUSION_BE } from "./color";

/* == Mix functions == */
/** @param cs raw color values */
function mix_je(...cs: [r: number, g: number, b: number][]): [r: number, g: number, b: number]{
  let tr = 0, tg = 0, tb = 0, tm = 0;
  for(const c of cs){
    const [r, g, b] = c;
    tr += r;
    tg += g;
    tb += b;
    tm += Math.max(r, g, b);
  }
  // alpha
  const a = (
    tm / cs.length /
    Math.max(
      Math.floor(tr / cs.length),
      Math.floor(tg / cs.length),
      Math.floor(tb / cs.length),
    )
  );
  // lerping
  return [
    Math.floor(tr / cs.length) * a,
    Math.floor(tg / cs.length) * a,
    Math.floor(tb / cs.length) * a,
  ];
}

/** 
 * Mix colors, 2 at a time, as floats. Cauldrons do this in BE.
 * @param cs sRGB vector; `r`, `g`, `b` are floats ranging from `0` to `1`, where `1` represents a 255 in the sRGB space;
 * - BE might represent these with float32, but that is too inconvenient to setup in JavaScript; so we use float64 instead;
 **/
function mix_be(...cs: [r: number, g: number, b: number][]): [r: number, g: number, b: number]{
  let [cr, cg, cb] = cs[0];
  for(let i = 1; i < cs.length; i++){
    const [r, g, b] = cs[i];
    cr = (cr + r) / 2;
    cg = (cg + g) / 2;
    cb = (cb + b) / 2;
  }
  return [
    Math.floor(cr * 0xff),
    Math.floor(cg * 0xff),
    Math.floor(cb * 0xff),
  ];
}

/** Fuses a list of colors (for `mix_je`), making it so computations don't need to be repeated. */
class FusionJE{
  readonly i;
  readonly totalR;
  readonly totalG;
  readonly totalB;
  readonly totalMax;
  constructor(i: number[], ...cs: [r: number, g: number, b: number][]){
    this.i = i;
    this.totalR = 0;
    this.totalG = 0;
    this.totalB = 0;
    this.totalMax = 0;
    for(const c of cs){
      const [r, g, b] = c;
      this.totalR += r;
      this.totalG += g;
      this.totalB += b;
      this.totalMax += Math.max(r, g, b);
    }
  }
}

/** Represests multiple instances of `FusionJE`, using `TypedArray`s. */
class FusionsJE{
  idx: number = 0;
  i: UintData;
  i_len: UintData;
  totalR: UintData;
  totalG: UintData;
  totalB: UintData;
  totalMax: UintData;
  capacity: number;
  constructor(fusions: FusionJE[]){
    // start with a small capacity and grow as needed
    this.capacity = 256;
    this.i = MakeData(this.capacity, "int", "int");
    this.i_len = MakeData(this.capacity, "int", "nibble");
    this.totalR = MakeData(this.capacity, "int", "short");
    this.totalG = MakeData(this.capacity, "int", "short");
    this.totalB = MakeData(this.capacity, "int", "short");
    this.totalMax = MakeData(this.capacity, "int", "short");
    for(const fusion of fusions){
      this.push(fusion);
    }
  }
  push(fusion: FusionJE){
    // grow if needed
    if(this.idx >= this.capacity){
      this.capacity *= 2;
      this.i = this.i.grow(this.capacity);
      this.i_len = this.i_len.grow(this.capacity);
      this.totalR = this.totalR.grow(this.capacity);
      this.totalG = this.totalG.grow(this.capacity);
      this.totalB = this.totalB.grow(this.capacity);
      this.totalMax = this.totalMax.grow(this.capacity);
    }
    // combine the indices into a single integer; 8 indices, 4 bits each;
    this.i.s(this.idx, fusion.i.reduce((a, b) => ((a << 4) | (b & 0xf)) >>> 0, 0));
    this.i_len.s(this.idx, fusion.i.length);
    // copy the other values over;
    this.totalR.s(this.idx, fusion.totalR);
    this.totalG.s(this.idx, fusion.totalG);
    this.totalB.s(this.idx, fusion.totalB);
    this.totalMax.s(this.idx, fusion.totalMax);
    this.idx++;
  }
  /**
   * Mix a color with one of the fusions.
   * @param c the color to mix with (the cauldron color, as a `color_int`);
   * @param idx the fusion index;
   * @returns the mixed color;
   */
  mix(c: number, idx: number): number{
    const n = this.i_len.g(idx) + 1;
    // JE is a bit more complicated;
    const cr = (c >>> 16);
    const cg = (c >>> 8) & 0xff;
    const cb = (c & 0xff);
    const r = this.totalR.g(idx) + cr;
    const g = this.totalG.g(idx) + cg;
    const b = this.totalB.g(idx) + cb;
    const m = this.totalMax.g(idx) + Math.max(cr, cg, cb);
    // alpha
    const a = (
      (m / n) /
      Math.max(
        Math.floor(r / n),
        Math.floor(g / n),
        Math.floor(b / n),
      )
    );
    // lerping
    return (
      (((r / n) * a) >> 16) |
      (((g / n) * a) >> 8) |
      (((b / n) * a) >> 0)
    );
  }
}

/** Fuses a list of colors (for `mix_be`), making it so computations don't need to be repeated. */
class FusionBE{
  readonly i;
  readonly r: number;
  readonly g: number;
  readonly b: number;
  constructor(i: number[], ...cs: [r: number, g: number, b: number][]){
    this.i = i;
    this.r = cs[0][0];
    this.g = cs[0][1];
    this.b = cs[0][2];
    for(let i = 1; i < cs.length; i++){
      const [r, g, b] = cs[i];
      this.r = (this.r + r) / 2;
      this.g = (this.g + g) / 2;
      this.b = (this.b + b) / 2;
    }
  }
}

/** Represests multiple instances of `FusionBE`, using `TypedArray`s. */
class FusionsBE{
  size: number = 0;
  capacity: number;
  i: UintData;
  i_len: UintData;
  r: UintData;
  g: UintData;
  b: UintData;
  constructor(fusions: FusionBE[]){
    this.capacity = 256;
    this.i = MakeData(this.capacity, "int", "int");
    this.i_len = MakeData(this.capacity, "int", "nibble");
    this.r = MakeData(this.capacity, "int", "float");
    this.g = MakeData(this.capacity, "int", "float");
    this.b = MakeData(this.capacity, "int", "float");
    for(const fusion of fusions){
      this.push(fusion);
    }
  }
  push(fusion: FusionBE){
    // grow if needed
    if(this.size >= this.capacity){
      this.capacity *= 2;
      this.i.grow(this.capacity);
      this.i_len.grow(this.capacity);
      this.r.grow(this.capacity);
      this.g.grow(this.capacity);
      this.b.grow(this.capacity);
    }
    // combine the indices into a single integer; 8 indices, 4 bits each;
    this.i.s(this.size, fusion.i.reduce((a, b) => ((a << 4) | (b & 0xf)) >>> 0, 0));
    this.i_len.s(this.size, fusion.i.length);
    // copy the other values over;
    this.r.s(this.size, fusion.r);
    this.g.s(this.size, fusion.g);
    this.b.s(this.size, fusion.b);
    this.size++;
  }
  /**
   * Mix a color with one of the fusions.
   * @param c the color to mix with (the cauldron color, as a `color_int`);
   * @param idx the fusion index;
   * @returns the mixed color;
   */
  mix(c: number, idx: number): number{
    const n = this.i_len.g(idx);
    // behold, my incorrigible code!
    /*
    translation:
    return (vector form of c / 255 + fusion_color * (2^n - 1)) / 2^n * 255;
    n is the number of dyes in the fusion.
    */
    return (
      (((
        (( c >>> 16        ) / 0xff +
        this.r.g(idx) * (2**n - 1)) / 2**n
      ) * 0xff) << 16) |
      (((
        (((c >>>  8) & 0xff) / 0xff +
        this.g.g(idx) * (2**n - 1)) / 2**n
      ) * 0xff) << 8) |
      (((
        (( c         & 0xff) / 0xff +
        this.b.g(idx) * (2**n - 1)) / 2**n
      ) * 0xff) << 0)
    );
  }
}

/**
 * Choose `k` items from `n`, with repetitions allowed.
 * @param n total items to choose from;
 * @param k items to choose;
 * @param f callback function called with each combination; the argument is a sorted array of the indices chosen;
 */
function choose_with_reps(n: number, k: number, f: (using: number[]) => void){
  // Initialize with k zeros
  const using = new Array<number>(k).fill(0);

  while (true) {
    f(using.slice());

    // find rightmost position that can be incremented;
    let i = k - 1;
    while (i >= 0 && using[i] === n - 1) i--;
    // if none, we're done;
    if (i < 0) break;

    // increment that position and copy its value to the right;
    using[i]++;
    for (let j = i + 1; j < k; j++) using[j] = using[i];
  }
}

/**
 * Iterate through all sequences of `k` items that can be made with `n` to choose from.
 * @param n total items to choose from;
 * @param k items to choose for each sequence;
 * @param f callback function called with each sequence; the argument is a sorted array of the indices chosen;
 */
function all_sequences(n: number, k: number, f: (using: number[]) => void){
  // Initialize with k zeros
  const using = new Array<number>(k).fill(0);
  
  while (true) {
    f(using.slice());
    
    // increment the rightmost position;
    let i = k - 1;
    using[i]++;
    // and carry
    while (i > 0 && using[i] === n - 1){
      using[i] = 0;
      i--;
      using[i]++;
    }
    // if we the last position has max value, then we're done;
    if (i < 1) break;
  }
}

/* If your first thought was "Oh, the combinations with repetitions are the hard part", you were very wrong. */
function generate_fusions_je(){
  const fusions: FusionJE[] = [];
  for(let dyes = 1; dyes <= MAX_DYES_PER_CRAFT; dyes++){
    choose_with_reps(16, dyes, (using) => {
      const fusion = new FusionJE(using, ...using
        .map(i => colors_je[i])
        .map(i => [
          i >>> 16,
          (i >>> 8) & 0xff,
          i & 0xff
        ] as [number, number, number])
      );
      fusions.push(fusion);
    });
  }
  return new FusionsJE(fusions);
}

function generate_fusions_be(){
  const fusions: FusionBE[] = [];
  for(let dyes = 1; dyes <= MAX_DYES_FUSION_BE; dyes++){
    all_sequences(16, dyes, (using) => {
      const fusion = new FusionBE(using, ...using
        .map(i => colors_be[i])
        .map(i => [
          ( i >>> 16        ) / 0xff,
          ((i >>>  8) & 0xff) / 0xff,
          ( i         & 0xff) / 0xff,
        ] as [number, number, number])
      );
      fusions.push(fusion);
    });
  }
  return new FusionsBE(fusions);
}

export const FUSIONS_JE = []; // generate_fusions_je();
export const FUSIONS_BE = []; // generate_fusions_be();
export {
  FusionJE,
  FusionBE,
  FusionsJE,
  FusionsBE,
  mix_je,
  mix_be,
}

