import { UintData, MakeData } from "./data";
import { MAX_DYES_PER_CRAFT } from "./color";

/* == Data structures for all of our recipes (called entries) == */

const NO_ENTRY = 0xffffffff;

/**
 * Used for the different qualifications of recipes in `EntriesJE`. Each `UintData` member represents an array of its respective piece of the data for each color entry.
 */
class RecipesJE{
  /** The total number of crafting cycles used to make the color. */
  craftc: UintData;
  /** The total number of dyes used to make the color. */
  dyec:   UintData;
  /** The maximum number of dyes used in any crafting step to make the color. */
  dyemax: UintData;
  /** Array of the indices of the dyes used in this craft. */
  dyes:   UintData;
  /** Length of this.dyes. Max length is 8. */
  dyelen: UintData;
  /** The parent color. i.e. the color the armor needs to have before this craft. */
  color:  UintData;
  constructor(){
    this.craftc = MakeData(64*64*64*64, "int", "byte");
    this.dyec   = MakeData(64*64*64*64, "int", "byte");
    this.dyemax = MakeData(64*64*64*64, "int", "nibble");
    this.dyes   = MakeData(64*64*64*64, "int", "int");
    this.dyelen = MakeData(64*64*64*64, "int", "nibble");
    this.color  = MakeData(64*64*64*64, "int", "int");
    
    this.craftc.d.fill(0xff);
    this.dyec  .d.fill(0xff);
    this.dyemax.d.fill(0xff);
    this.color .d.fill(0xffffffff);
  }
}

/**
 * Each of the `RecipesJE` and `found` members represents an array of its respective piece of the data for each color entry.
 */
class RecipesJEWrapper{
  /** The number of colors in       **the dataset** which have recipes found for them. */
  found0: number;
  /** The number of colors in each **supersection** which have recipes found for them. */
  found1: UintData;
  /** The number of colors in each      **section** which have recipes found for them. */
  found2: UintData;
  /** The number of colors in each   **subsection** which have recipes found for them. */
  found3: UintData;
  /** Whether the color has been found. */
  found:  UintData;
  /** The recipe for the color. */
  recipe: RecipesJE;
  constructor(){
    this.found0 = 0;
    this.found1 = MakeData(64, "int", "int");
    this.found2 = MakeData(64*64, "int", "short");
    this.found3 = MakeData(64*64*64, "int", "byte");
    this.found  = MakeData(64*64*64*64, "int", "bit");
    this.recipe = new RecipesJE();
  }
}

/**
 * All of the best JE recipes, sorted by different metrics and restrictions.
 * - Each `RecipesJEWrapper` member represents an array of its respective piece of the data for each color entry.
 */
class EntriesJE{
  /** The recipe for the color with the least crafts required. */
  craftc:  RecipesJEWrapper;
  /** The recipe for the color with the least total dyes required. */
  dyec:    RecipesJEWrapper;
  /** The recipe for the color with the least crafts required in the last crafting step. */
  dyelast: RecipesJEWrapper;
  /** The recipes for the color, with varying limits on how many dyes can be used per crafting step. dyelim[0] would be 1 dye per step, dyelim[1] would be 2 dyes per step, etc. This is used to find the dyemax recipes. */
  dyelim: RecipesJEWrapper[] = [];
  /** The recipe for the color that doesn't use brown dye. */
  no_brown: RecipesJEWrapper;
  /** The recipe for the color that only uses red, orange, yellow, green, blue, purple dyes. */
  only_roygbp: RecipesJEWrapper;
  /** The recipe for the color that doesn't repeat any dye. */
  no_reps: RecipesJEWrapper;
  /** The recipe for the color that doesn't repeat any dye in a single crafting step. */
  no_reps_craft: RecipesJEWrapper;
  constructor(){
    this.craftc  = new RecipesJEWrapper();
    this.dyec    = new RecipesJEWrapper();
    this.dyelast = new RecipesJEWrapper();
    this.no_brown      = new RecipesJEWrapper();
    this.only_roygbp   = new RecipesJEWrapper();
    this.no_reps       = new RecipesJEWrapper();
    this.no_reps_craft = new RecipesJEWrapper();
    // is this required?
    this.dyelim   = [];
    // this filling step is, but I don't know about the initialization above;
    for(let i = 0; i < MAX_DYES_PER_CRAFT; i++){
      this.dyelim.push(new RecipesJEWrapper());
    }
  }
}

/**
 * All of the best BE recipes.
 * - Each `UintData` member represents an array of its respective piece of the data for each color entry, except for `found1`, `found2`, and `found3`.
 */
class EntriesBE{
  /** The number of colors in       **the dataset** which have recipes found for them. */
  found0: number;
  /** The number of colors in each **supersection** which have recipes found for them. */
  found1: UintData;
  /** The number of colors in each      **section** which have recipes found for them. */
  found2: UintData;
  /** The number of colors in each   **subsection** which have recipes found for them. */
  found3: UintData;
  /** Whether the color has been found. */
  found:  UintData;
  /** Index of the last dye added to the cauldron. */
  dye:    UintData;
  /** The parent color. i.e. the color the water had before the last dye was added. */
  color:  UintData;
  constructor(){
    this.found0 = 0;
    this.found1 = MakeData(64, "int", "int");
    this.found2 = MakeData(64*64, "int", "short");
    this.found3 = MakeData(64*64*64, "int", "byte");
    this.found  = MakeData(64*64*64*64, "int", "bit");
    this.dye    = MakeData(64*64*64*64, "int", "nibble");
    this.color  = MakeData(64*64*64*64, "int", "int");
  }
}

class RecipesJE_Handler{
  recipes: RecipesJEWrapper
  constructor(recipes: RecipesJEWrapper){
    this.recipes = recipes;
  }
  /** Add a color (track it in all found levels). */
  add(c: number){
    // some bits are not used by these, because the are covered by recipes.found;
    const i1 = (((c >>> 22) & 3) << 4) | (((c >>> 14) & 3) << 2) | (((c >>>  6) & 3) << 0);
    const i2 = (((c >>> 20) & 3) << 4) | (((c >>> 12) & 3) << 2) | (((c >>>  4) & 3) << 0);
    const i3 = (((c >>> 18) & 3) << 4) | (((c >>> 10) & 3) << 2) | (((c >>>  2) & 3) << 0);
    
    this.recipes.found0++;
    this.recipes.found1.s(
      i1,
      this.recipes.found1.g(i1) + 1
    );
    this.recipes.found2.s(
      (i1 << 6) | i2,
      this.recipes.found2.g((i1 << 6) | i2) + 1
    );
    this.recipes.found3.s(
      (i1 << 12) | (i2 << 6) | i3,
      this.recipes.found3.g((i1 << 12) | (i2 << 6) | i3) + 1
    );
    this.recipes.found.s(c, 1);
  }
}
class RecipesBE_Handler{
  recipes: EntriesBE = new EntriesBE();
  /** Add a color (track it in all found levels). */
  add(c: number){
    // some bits are not used by these, because the are covered by recipes.found;
    const i1 = (((c >>> 22) & 3) << 4) | (((c >>> 14) & 3) << 2) | (((c >>>  6) & 3) << 0);
    const i2 = (((c >>> 20) & 3) << 4) | (((c >>> 12) & 3) << 2) | (((c >>>  4) & 3) << 0);
    const i3 = (((c >>> 18) & 3) << 4) | (((c >>> 10) & 3) << 2) | (((c >>>  2) & 3) << 0);
    
    this.recipes.found0++;
    this.recipes.found1.s(
      i1,
      this.recipes.found1.g(i1) + 1
    );
    this.recipes.found2.s(
      (i1 << 6) | i2,
      this.recipes.found2.g((i1 << 6) | i2) + 1
    );
    this.recipes.found3.s(
      (i1 << 12) | (i2 << 6) | i3,
      this.recipes.found3.g((i1 << 12) | (i2 << 6) | i3) + 1
    );
    this.recipes.found.s(c, 1);
  }
}

export {
  EntriesJE,
  EntriesBE,
  RecipesJE_Handler,
  RecipesBE_Handler,
}
