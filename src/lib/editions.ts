import {
  colors_je, colors_be,
  color_index,
  split_je, split_be,
  merge_je, merge_be,
} from './color';
import {
  mix_je, mix_be,
  FusionJE, FusionBE,
  FusionsJE, FusionsBE,
} from './mix';

export const JE = {
  colors: colors_je,
  cn: Object.fromEntries(
    Object.getOwnPropertyNames(color_index).map(
      key => [key, colors_je[color_index[
        key as keyof typeof color_index
      ]]]
    )
  ),
  split: split_je,
  merge: merge_je,
  mix: mix_je,
  Fusion: FusionJE,
  Fusions: FusionsJE,
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
  split: split_be,
  merge: merge_be,
  mix: mix_be,
  Fusion: FusionBE,
  Fusions: FusionsBE,
};
