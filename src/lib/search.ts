import {
  colors_je, colors_be,
} from "./color";
import {
  mix_je, mix_be,
  FusionJE, FusionBE,
  FusionsJE, FusionsBE,
} from "./mix";

function test_fusion(
  base: number, fusion_c: number[],
  colors_e: typeof colors_je, mix_e: typeof mix_je,
  fusion_e: (typeof FusionJE) | (typeof FusionBE),
  fusion_mix: (
    base: [number, number, number],
    fusion_e: FusionJE | FusionBE
  ) => [number, number, number],
) {
  const colors = [base, ...fusion_c].map(
    index => [
      (colors_e[index] >> 16),
      (colors_e[index] >> 8) & 0xff,
      (colors_e[index] & 0xff),
    ] as [number, number, number]
  )
  const expect = mix_e(...colors);
  const fusion = new fusion_e([...fusion_c], ...colors.slice(1));
  const mixed = fusion_mix(colors[0], fusion);
}

function test_fusion_je(base: number, fusion: number[]) {
  test_fusion(
    base, fusion, colors_je, mix_je, FusionJE,
    (base, fusion) => {
      const fusions = new FusionsJE([fusion as FusionJE]);
      const c = fusions.mix(
        (base[0] << 16) | (base[1] << 8) | base[2],
        0,
      );
      return [
        (c >> 16),
        (c >> 8) & 0xff,
        (c & 0xff),
      ];
    }
  );
}
function test_fusion_be(base: number, fusion_c: number[]) {
  test_fusion(
    base, fusion_c, colors_be, mix_be, FusionBE,
    (base, fusion) => {
      const fusions = new FusionsBE([fusion as FusionBE]);
      // BE has all these noramlization steps;
      const c = fusions.mix(
        ((base[0] * 0xff) << 16) |
        ((base[1] * 0xff) << 8) |
        ((base[2] * 0xff)),
        0,
      );
      return [
        ((c >> 16))       / 0xff,
        ((c >> 8) & 0xff) / 0xff,
        (c        & 0xff) / 0xff,
      ];
    }
  );
}

function test_fusions(){
  test_fusion_je(0, [5, 7]);
  test_fusion_be(0, [5, 7]);
}

export { test_fusions };
