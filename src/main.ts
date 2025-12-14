
import {
  UintData,
  MakeData,
} from "./lib/data";

import  {
  JE, BE
} from "./lib/editions";

import {
  test_fusions,
  SearchJE
} from "./lib/search";

import { FrameHandler } from "./lib/frame";
import { load_page } from "./lib/ui";

// make everything globally accessible for easy debugging in the browser console;
(window as any).UintData = UintData;
(window as any).MakeData = MakeData;
(window as any).JE = JE;
(window as any).BE = BE;
(window as any).test_fusions = test_fusions;
(window as any).EntriesJE = JE.entries;
(window as any).EntriesBE = BE.entries;
(window as any).RecipesJE_Handler = JE.handler;
(window as any).RecipesBE_Handler = BE.handler;
(window as any).MAX_DYES_PER_CRAFT = JE.dyemax;
(window as any).MAX_DYES_FUSION_BE = BE.dyemax;
(window as any).colors_je = JE.colors;
(window as any).colors_be = BE.colors;
(window as any).FUSIONS_JE = JE.Fusions;
(window as any).FUSIONS_BE = BE.Fusions;
(window as any).mix_je = JE.mix;
(window as any).mix_be = BE.mix;

// test_fusions();

console.log("loading page...");

const frame = new FrameHandler();
(window as any).frame = frame;

const search_instance_je = new SearchJE();
(window as any).search_instance_je = search_instance_je;

load_page(search_instance_je, frame);


