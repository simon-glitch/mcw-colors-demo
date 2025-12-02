
import {
  UintData,
  MakeData,
} from "./lib/data";

import {
  EntriesJE,
  EntriesBE,
  RecipesJE_Handler,
  RecipesBE_Handler,
} from "./lib/recipes";

import {
  MAX_DYES_PER_CRAFT,
  MAX_DYES_FUSION_BE,
  colors_je,
  colors_be,
  color_index,
} from "./lib/color";

import  {
  FUSIONS_JE,
  FUSIONS_BE,
  mix_je,
  mix_be,
} from "./lib/mix";

import {
  test_fusions,
} from "./lib/search";

// make everything globally accessible for easy debugging in the browser console;
(window as any).UintData = UintData;
(window as any).MakeData = MakeData;
(window as any).EntriesJE = EntriesJE;
(window as any).EntriesBE = EntriesBE;
(window as any).RecipesJE_Handler = RecipesJE_Handler;
(window as any).RecipesBE_Handler = RecipesBE_Handler;
(window as any).MAX_DYES_PER_CRAFT = MAX_DYES_PER_CRAFT;
(window as any).MAX_DYES_FUSION_BE = MAX_DYES_FUSION_BE;
(window as any).colors_je = colors_je;
(window as any).colors_be = colors_be;
(window as any).color_index = color_index;
(window as any).FUSIONS_JE = FUSIONS_JE;
(window as any).FUSIONS_BE = FUSIONS_BE;
(window as any).mix_je = mix_je;
(window as any).mix_be = mix_be;


