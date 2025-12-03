import {
  JE, BE
} from "./editions";
import { FusionJE, FusionBE } from "./mix";

function test_fusion(
  base: number, fusion_c: number[],
  E: typeof JE | typeof BE,
) {
  const colors = [base, ...fusion_c].map(index => E.split(E.colors[index]));
  const expect = E.mix(...colors);
  const fusion = new E.Fusion([...fusion_c], ...colors.slice(1));
  const fusions = new E.Fusions([fusion] as FusionJE[] & FusionBE[]);
  const c = fusions.mix(E.colors[base], 0);
  const result = E.split(c);
  for(let i = 0; i < 3; i++){
    if(Math.abs(result[i] - expect[i]) > 1e-6){
      const e = new Error(
        `Fusion test failed for base color index ${base}, `
        + `on ${"RGB"[i]} component, `
        + `with fusion colors ${fusion_c.join(", ")}, `
        + `in edition ${E === JE ? "JE" : "BE"}: `
        + `expected ${expect[i]}, got ${result[i]}.`
      );
      console.log({fusion, fusions});
      throw e;
    }
  }
}

function test_fusion_je(base: number, fusion_c: number[]) {
  test_fusion(base, fusion_c, JE);
}
function test_fusion_be(base: number, fusion_c: number[]) {
  test_fusion(base, fusion_c, BE);
}

function test_fusions(){
  test_fusion_je(0, [5]);
  test_fusion_be(0, [5]);
  test_fusion_je(0, [5, 7]);
  test_fusion_be(0, [5, 7]);
}

export { test_fusions };
