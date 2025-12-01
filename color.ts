
/** The maximum number of dyes that can be used in a single crafting step. */
const MAX_DYES_PER_CRAFT = 8;

/** How many dyes to put in the fusions for BE (see mix.c). */
const MAX_DYES_FUSION_BE = 5;

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

export{
  MAX_DYES_PER_CRAFT,
  MAX_DYES_FUSION_BE,
  colors_je,
  colors_be,
  color_index,
};

