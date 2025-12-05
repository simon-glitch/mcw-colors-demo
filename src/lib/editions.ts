import {
  colors_je, colors_be,
  color_index,
  split_je, split_be,
  merge_je, merge_be,
  MAX_DYES_PER_CRAFT,
  MAX_DYES_FUSION_BE,
} from './color';
import {
  mix_je, mix_be,
  FusionJE, FusionBE,
  FusionsJE, FusionsBE,
  FUSIONS_JE, FUSIONS_BE,
} from './mix';

import {
  EntriesJE,
  EntriesBE,
  RecipesJE_Handler,
  RecipesBE_Handler,
} from './recipes';

export const JE = {
  colors: colors_je,
  cn: Object.fromEntries(
    Object.getOwnPropertyNames(color_index).map(
      key => [key, colors_je[color_index[
        key as keyof typeof color_index
      ]]]
    )
  ),
  dyemax: MAX_DYES_PER_CRAFT,
  split: split_je,
  merge: merge_je,
  mix: mix_je,
  Fusion: FusionJE,
  Fusions: FusionsJE,
  entries: EntriesJE,
  handler: RecipesJE_Handler,
  fusions: FUSIONS_JE,
};
export const BE = {
  colors: colors_be,
  cn: Object.fromEntries(
    Object.getOwnPropertyNames(color_index).map(
      key => [key, colors_be[color_index[
        key as keyof typeof color_index
      ]]]
    )
  ),
  dyemax: MAX_DYES_FUSION_BE,
  split: split_be,
  merge: merge_be,
  mix: mix_be,
  Fusion: FusionBE,
  Fusions: FusionsBE,
  entries: EntriesBE,
  handler: RecipesBE_Handler,
  fusions: FUSIONS_BE,
};
