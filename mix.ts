
import { UintData, MakeData } from "./data.js";
import { colors_je, colors_be, color_index, MAX_DYES_PER_CRAFT, MAX_DYES_FUSION_BE } from "./color.js";

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

/** Represets multiple instances of `FusionJE`, using `TypedArray`s. */
class FusionsJE{
  idx: number = 0;
  i: UintData;
  i_len: UintData;
  totalR: UintData;
  totalG: UintData;
  totalB: UintData;
  totalMax: UintData;
  constructor(){
    this.i = MakeData(0, "int", "int");
    this.i_len = MakeData(0, "int", "nibble");
    this.totalR = MakeData(0, "int", "short");
    this.totalG = MakeData(0, "int", "short");
    this.totalB = MakeData(0, "int", "short");
    this.totalMax = MakeData(0, "int", "short");
  }
  push(fusion: FusionJE){
    // combine the indices into a single integer; 8 indices, 4 bits each;
    this.i.s(this.idx, fusion.i.reduce((a, b) => (a >> 4) | (b << 28), 0));
    this.i_len.s(this.idx, fusion.i.length);
    // copy the other values over;
    this.totalR.s(this.idx, fusion.totalR);
    this.totalG.s(this.idx, fusion.totalG);
    this.totalB.s(this.idx, fusion.totalB);
    this.totalMax.s(this.idx, fusion.totalMax);
    this.idx++;
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

/** Represets multiple instances of `FusionBE`, using `TypedArray`s. */
class FusionsBE{
  idx: number = 0;
  i: UintData;
  i_len: UintData;
  r: UintData;
  g: UintData;
  b: UintData;
  constructor(){
    this.i = MakeData(0, "int", "int");
    this.i_len = MakeData(0, "int", "nibble");
    this.r = MakeData(0, "int", "float");
    this.g = MakeData(0, "int", "float");
    this.b = MakeData(0, "int", "float");
  }
  push(fusion: FusionBE){
    // combine the indices into a single integer; 8 indices, 4 bits each;
    this.i.s(this.idx, fusion.i.reduce((a, b) => (a >> 4) | (b << 28), 0));
    this.i_len.s(this.idx, fusion.i.length);
    // copy the other values over;
    this.r.s(this.idx, fusion.r);
    this.g.s(this.idx, fusion.g);
    this.b.s(this.idx, fusion.b);
    this.idx++;
  }
}

/**
 * Choose `k` items from `n`, with repetitions allowed.
 * @param n total items to choose from;
 * @param k items to choose;
 * @param f callback function called with each combination; the argument is a sorted array of the indices chosen;
 */
function choose_with_reps(n: number, k: number, f: (using: number[]) => void){
  const using = [];
  for(let i = 0; i < k; i++){
    using[i] = 0;
  }
  let j = k - 1;
  
  while(using[k - 1] < n){
    f(using.slice());
    
    // weird handling of last cycle;
    while(j > 0 && using[j] === n - 1){
      j--;
    }
    using[j]++;
    while(j < k - 1){
      using[j + 1] = using[j];
      j++;
    }
  }
}

/* If your first thought was "Oh, the combinations with repetitions are the hard part", you were very wrong. */
function generate_fusions_je(){
  const fusions = new FusionsJE();
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
  return fusions;
}

/* If your first thought was "Oh, the combinations with repetitions are the hard part", you were very wrong. */
function generate_fusions_be(){
  const fusions = new FusionsBE();
  for(let dyes = 1; dyes <= MAX_DYES_FUSION_BE; dyes++){
    choose_with_reps(16, dyes, (using) => {
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
  return fusions;
}

export const FUSIONS_JE = generate_fusions_je();
export const FUSIONS_BE = generate_fusions_be();
export {
  colors_je,
  colors_be,
  color_index,
  mix_je,
  mix_be,
}
