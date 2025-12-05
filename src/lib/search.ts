import { MakeData, UintData } from "./data";
import {
  JE, BE
} from "./editions";
import { FusionJE, FusionBE } from "./mix";
import { RecipesJE_Handler, RecipesBE_Handler } from "./recipes";

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

class SearchJE{
  entries = new JE.entries();
  recipes = {
    craftc:  new JE.handler(this.entries.craftc ),
    dyec:    new JE.handler(this.entries.dyec   ),
    dyemax:  new JE.handler(this.entries.dyemax ),
    dyelast: new JE.handler(this.entries.dyelast),
  }
  mixing = {
    craftc:  false,
    dyec:    false,
    dyemax:  false,
    dyelast: false,
  }
  curr_queue: UintData;
  next_queue: UintData;
  constructor(){
    this.curr_queue = MakeData(64*64*64*64, "int", "bit");
    this.next_queue = MakeData(64*64*64*64, "int", "bit");
  }
  update_queue(): void{
    this.curr_queue = MakeData(64*64*64*64, "int", "bit");
    for(let i = 0; i < 64*64*64*64; i++){
      if(this.next_queue.g(i)){
        this.curr_queue.s(i, 1);
      }
    }
    this.next_queue = MakeData(64*64*64*64, "int", "bit");
  }
  mix_craftc(
    next: number,
  ): void{
    if(this.entries.craftc .found.g(next)){
      return;
    }
    this.next_queue.s(next, 1);
    this.recipes.craftc .add(next);
    const next_craftc  = this.entries.craftc .recipe.craftc.g(next);
    const prev_craftc  = this.entries.craftc .recipe.craftc.g(next);
    if(next_craftc > prev_craftc){
      return;
    }
    const next_dyec    = this.entries.craftc .recipe.dyec  .g(next);
    const next_dyemax  = this.entries.craftc .recipe.dyemax.g(next);
    const next_dyelast = this.entries.craftc .recipe.dyelen.g(next);
    const prev_dyec    = this.entries.craftc .recipe.dyec  .g(next);
    const prev_dyemax  = this.entries.craftc .recipe.dyemax.g(next);
    const prev_dyelast = this.entries.craftc .recipe.dyelen.g(next);
    if(
      (next_craftc < prev_craftc) ||
      (next_craftc === prev_craftc && next_dyec < prev_dyec ) ||
      (next_craftc === prev_craftc && next_dyec === prev_dyec && next_dyemax < prev_dyemax) ||
      (next_craftc === prev_craftc && next_dyec === prev_dyec && next_dyemax === prev_dyemax && next_dyelast < prev_dyelast)
    ){
      this.entries.craftc .recipe.craftc.s(next, next_craftc );
      this.entries.craftc .recipe.dyec  .s(next, next_dyec   );
      this.entries.craftc .recipe.dyemax.s(next, next_dyemax );
      this.entries.craftc .recipe.dyelen.s(next, next_dyelast);
    }
  }
  mix_dyec(
    next: number,
  ): void{
    if(this.entries.dyec   .found.g(next)){
      return;
    }
    this.next_queue.s(next, 1);
    this.recipes.dyec   .add(next);
    const next_craftc  = this.entries.dyec   .recipe.craftc.g(next);
    const prev_craftc  = this.entries.dyec   .recipe.craftc.g(next);
    if(next_craftc > prev_craftc){
      return;
    }
    const next_dyec    = this.entries.dyec   .recipe.dyec  .g(next);
    const next_dyemax  = this.entries.dyec   .recipe.dyemax.g(next);
    const next_dyelast = this.entries.dyec   .recipe.dyelen.g(next);
    const prev_dyec    = this.entries.dyec   .recipe.dyec  .g(next);
    const prev_dyemax  = this.entries.dyec   .recipe.dyemax.g(next);
    const prev_dyelast = this.entries.dyec   .recipe.dyelen.g(next);
    if(
      (next_dyec < prev_dyec) ||
      (next_dyec === prev_dyec && next_craftc < prev_craftc ) ||
      (next_dyec === prev_dyec && next_craftc === prev_craftc && next_dyemax < prev_dyemax) ||
      (next_dyec === prev_dyec && next_craftc === prev_craftc && next_dyemax === prev_dyemax && next_dyelast < prev_dyelast)
    ){
      this.entries.dyec   .recipe.craftc.s(next, next_craftc );
      this.entries.dyec   .recipe.dyec  .s(next, next_dyec   );
      this.entries.dyec   .recipe.dyemax.s(next, next_dyemax );
      this.entries.dyec   .recipe.dyelen.s(next, next_dyelast);
    }
  }
  mix_dyemax(
    next: number,
  ): void{
    if(this.entries.dyemax .found.g(next)){
      return;
    }
    this.next_queue.s(next, 1);
    this.recipes.dyemax .add(next);
    const next_craftc  = this.entries.dyemax .recipe.craftc.g(next);
    const prev_craftc  = this.entries.dyemax .recipe.craftc.g(next);
    if(next_craftc > prev_craftc){
      return;
    }
    const next_dyec    = this.entries.dyemax .recipe.dyec  .g(next);
    const next_dyemax  = this.entries.dyemax .recipe.dyemax.g(next);
    const next_dyelast = this.entries.dyemax .recipe.dyelen.g(next);
    const prev_dyec    = this.entries.dyemax .recipe.dyec  .g(next);
    const prev_dyemax  = this.entries.dyemax .recipe.dyemax.g(next);
    const prev_dyelast = this.entries.dyemax .recipe.dyelen.g(next);
    if(
      (next_dyemax < prev_dyemax) ||
      (next_dyemax === prev_dyemax && next_craftc < prev_craftc ) ||
      (next_dyemax === prev_dyemax && next_craftc === prev_craftc && next_dyec < prev_dyec) ||
      (next_dyemax === prev_dyemax && next_craftc === prev_craftc && next_dyec === prev_dyec && next_dyelast < prev_dyelast)
    ){
      this.entries.dyemax .recipe.craftc.s(next, next_craftc );
      this.entries.dyemax .recipe.dyec  .s(next, next_dyec   );
      this.entries.dyemax .recipe.dyemax.s(next, next_dyemax );
      this.entries.dyemax .recipe.dyelen.s(next, next_dyelast);
    }
  }
  mix_dyelast(
    next: number,
  ): void{
    if(this.entries.dyelast.found.g(next)){
      return;
    }
    this.next_queue.s(next, 1);
    this.recipes.dyelast.add(next);
    const next_craftc  = this.entries.dyelast.recipe.craftc.g(next);
    const prev_craftc  = this.entries.dyelast.recipe.craftc.g(next);
    if(next_craftc > prev_craftc){
      return;
    }
    const next_dyec    = this.entries.dyelast.recipe.dyec  .g(next);
    const next_dyemax  = this.entries.dyelast.recipe.dyemax.g(next);
    const next_dyelast = this.entries.dyelast.recipe.dyelen.g(next);
    const prev_dyec    = this.entries.dyelast.recipe.dyec  .g(next);
    const prev_dyemax  = this.entries.dyelast.recipe.dyemax.g(next);
    const prev_dyelast = this.entries.dyelast.recipe.dyelen.g(next);
    if(
      (next_dyelast < prev_dyelast) ||
      (next_dyelast === prev_dyelast && next_craftc < prev_craftc) ||
      (next_dyelast === prev_dyelast && next_craftc === prev_craftc && next_dyec < prev_dyec) ||
      (next_dyelast === prev_dyelast && next_craftc === prev_craftc && next_dyec === prev_dyec && next_dyemax < prev_dyemax)
    ){
      this.entries.dyelast.recipe.craftc.s(next, next_craftc );
      this.entries.dyelast.recipe.dyec  .s(next, next_dyec   );
      this.entries.dyelast.recipe.dyemax.s(next, next_dyemax );
      this.entries.dyelast.recipe.dyelen.s(next, next_dyelast);
    }
 }
  mix(base: number, fusion_idx: number){
    const next = JE.fusions.mix(base, fusion_idx);
    if(this.mixing.craftc){
      this.mix_craftc(next);
    }
    if(this.mixing.dyec){
      this.mix_dyec(next);
    }
    if(this.mixing.dyemax){
      this.mix_dyemax(next);
    }
    if(this.mixing.dyelast){
      this.mix_dyelast(next);
    }
  }
  mixes(base: number){
    for(let i = 0; i < JE.fusions.idx; i++){
      this.mix(base, i);
    }
  }
  main(){
    // add base fusions;
    // TODO
    
    // craftc search;
    this.mixing.craftc = true;
    for(let i = 0; i < 64*64*64*64; i++){
      if(this.curr_queue.g(i)){
        this.mixes(i);
      }
    }
    this.update_queue();
  }
}

export { test_fusions };
