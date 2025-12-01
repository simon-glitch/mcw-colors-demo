
const colors_je = [
  0xF9FFFE, // white       0;
  0x9D9D97, // light_gray  1;
  0x474F52, // gray        2;
  0x1D1D21, // black       3;
  0x835432, // brown       4;
  0xB02E26, // red         5;
  0xF9801D, // orange      6;
  0xFED83D, // yellow      7;
  0x80C71F, // lime        8;
  0x5E7C16, // green       9;
  0x169C9C, // cyan       10;
  0x3AB3DA, // light_blue 11;
  0x3C44AA, // blue       12;
  0x8932B8, // purple     13;
  0xC74EBD, // magenta    14;
  0xF38BAA, // pink       15;
];
const colors_be = [
  0xF0F0F0, // white       0;
  0x9D9D97, // light_gray  1;
  0x474F52, // gray        2;
  0x1D1D21, // black       3;
  0x835432, // brown       4;
  0xB02E26, // red         5;
  0xF9801D, // orange      6;
  0xFED83D, // yellow      7;
  0x80C71F, // lime        8;
  0x5E7C16, // green       9;
  0x169C9C, // cyan       10;
  0x3AB3DA, // light_blue 11;
  0x3C44AA, // blue       12;
  0x8932B8, // purple     13;
  0xC74EBD, // magenta    14;
  0xF38BAA, // pink       15;
];
const color_index = {
  white     :  0,
  light_gray:  1,
  gray      :  2,
  black     :  3,
  brown     :  4,
  red       :  5,
  orange    :  6,
  yellow    :  7,
  lime      :  8,
  green     :  9,
  cyan      : 10,
  light_blue: 11,
  blue      : 12,
  purple    : 13,
  magenta   : 14,
  pink      : 15,
};


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

export {
  colors_je,
  colors_be,
  color_index,
  mix_je,
  mix_be,
}
