import { MakeData, UintData } from "./data";
import {
  JE, BE
} from "./editions";
import {
  FusionJE, FusionBE
} from "./mix";
import {
  RecipesJE_Handler, RecipesBE_Handler
} from "./recipes";

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
    dyelast: new JE.handler(this.entries.dyelast),
    dyelim:  this.entries.dyelim.map(
      dyemax_entries => new JE.handler(dyemax_entries)
    ),
  }
  mixing = {
    craftc:  false,
    dyec:    false,
    dyelim:  false,
    dyelast: false,
    dyelim_i: 0,
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
    base: number,
    next: number,
  ): void{
    if(this.entries.craftc .found.g(next)){
      return;
    }
    this.next_queue.s(next, 1);
    this.recipes.craftc .add(next);
    const next_craftc  = this.entries.craftc .recipe.craftc.g(base) + 1;
    const prev_craftc  = this.entries.craftc .recipe.craftc.g(next);
    if(next_craftc > prev_craftc){
      return;
    }
    const next_dyelast = JE.fusions.i_len.g(next);
    const next_dyec    = (
      this.entries.craftc .recipe.dyec  .g(base) + 
      next_dyelast
    );
    const next_dyemax  = Math.max(
      this.entries.craftc .recipe.dyemax.g(base),
      next_dyec
    );
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
    base: number,
    next: number,
  ): void{
    if(this.entries.dyec   .found.g(next)){
      return;
    }
    this.next_queue.s(next, 1);
    this.recipes.dyec   .add(next);
    const next_craftc  = this.entries.dyec   .recipe.craftc.g(base) + 1;
    const prev_craftc  = this.entries.dyec   .recipe.craftc.g(next);
    if(next_craftc > prev_craftc){
      return;
    }
    const next_dyelast = JE.fusions.i_len.g(next);
    const next_dyec    = (
      this.entries.dyec   .recipe.dyec  .g(base) + 
      next_dyelast
    );
    const next_dyemax  = Math.max(
      this.entries.dyec   .recipe.dyemax.g(base),
      next_dyec
    );
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
  mix_dyelast(
    base: number,
    next: number,
  ): void{
    if(this.entries.dyelast.found.g(next)){
      return;
    }
    this.next_queue.s(next, 1);
    this.recipes.dyelast.add(next);
    const next_craftc  = this.entries.dyelast.recipe.craftc.g(base) + 1;
    const prev_craftc  = this.entries.dyelast.recipe.craftc.g(next);
    if(next_craftc > prev_craftc){
      return;
    }
    const next_dyelast = JE.fusions.i_len.g(next);
    const next_dyec    = (
      this.entries.dyelast.recipe.dyec  .g(base) + 
      next_dyelast
    );
    const next_dyemax  = Math.max(
      this.entries.dyelast.recipe.dyemax.g(base),
      next_dyec
    );
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
  mix_dyemax(
    base: number,
    next: number,
  ): void{
    const dyemax_entries = this.entries.dyelim[this.mixing.dyelim_i];
    if(dyemax_entries.found.g(next)){
      return;
    }
    this.next_queue.s(next, 1);
    this.recipes.dyelim[this.mixing.dyelim_i].add(next);
    const next_craftc  = dyemax_entries.recipe.craftc.g(base) + 1;
    const prev_craftc  = dyemax_entries.recipe.craftc.g(next);
    if(next_craftc > prev_craftc){
      return;
    }
    const next_dyelast = JE.fusions.i_len.g(next);
    const next_dyec    = (
      dyemax_entries.recipe.dyec  .g(base) + 
      next_dyelast
    );
    const next_dyemax  = Math.max(
      dyemax_entries.recipe.dyemax.g(base),
      next_dyec
    );
    const prev_dyec    = dyemax_entries.recipe.dyec  .g(next);
    const prev_dyemax  = dyemax_entries.recipe.dyemax.g(next);
    const prev_dyelast = dyemax_entries.recipe.dyelen.g(next);
    if(
      (next_dyemax < prev_dyemax) ||
      (next_dyemax === prev_dyemax && next_craftc < prev_craftc ) ||
      (next_dyemax === prev_dyemax && next_craftc === prev_craftc && next_dyec < prev_dyec) ||
      (next_dyemax === prev_dyemax && next_craftc === prev_craftc && next_dyec === prev_dyec && next_dyelast < prev_dyelast)
    ){
      dyemax_entries.recipe.craftc.s(next, next_craftc );
      dyemax_entries.recipe.dyec  .s(next, next_dyec   );
      dyemax_entries.recipe.dyemax.s(next, next_dyemax );
      dyemax_entries.recipe.dyelen.s(next, next_dyelast);
    }
  }
  mix(base: number, fusion_idx: number, allowed_fusions?: UintData){
    if(allowed_fusions && !allowed_fusions.g(fusion_idx)){
      return;
    }
    const next = JE.fusions.mix(base, fusion_idx);
    if(this.mixing.craftc){
      this.mix_craftc(base, next);
    }
    if(this.mixing.dyec){
      this.mix_dyec(base, next);
    }
    if(this.mixing.dyelim){
      this.mix_dyemax(base, next);
    }
    if(this.mixing.dyelast){
      this.mix_dyelast(base, next);
    }
  }
  mixes(base: number, allowed_fusions?: UintData){
    for(let i = 0; i < JE.fusions.idx; i++){
      this.mix(base, i, allowed_fusions);
    }
  }
  main(){
    // add base fusions;
    for(let i = 0; i < JE.fusions.idx; i++){
      // get the color that the fusion makes on its own;
      const fusion = JE.fusions.i.g(i);
      const fusion_len = JE.fusions.i_len.g(i);
      const colors = [
        (fusion >> 28) & 0xf,
        (fusion >> 24) & 0xf,
        (fusion >> 20) & 0xf,
        (fusion >> 16) & 0xf,
        (fusion >> 12) & 0xf,
        (fusion >>  8) & 0xf,
        (fusion >>  4) & 0xf,
        (fusion      ) & 0xf,
      ].slice(0, fusion_len);
      const result = JE.merge(
        JE.mix(...colors.map(
          idx => JE.split(JE.colors[idx])
        ))
      );
      // now add that color;
      this.recipes.craftc .add(result);
      this.recipes.dyec   .add(result);
      this.recipes.dyelast.add(result);
      // craftc = 1;
      this.entries.craftc .recipe.craftc.s(result, 1);
      this.entries.dyec   .recipe.craftc.s(result, 1);
      this.entries.dyelast.recipe.craftc.s(result, 1);
      // dyec = fusion_len;
      this.entries.craftc .recipe.dyec  .s(result, fusion_len);
      this.entries.dyec   .recipe.dyec  .s(result, fusion_len);
      this.entries.dyelast.recipe.dyec  .s(result, fusion_len);
      // dyemax = fusion_len;
      this.entries.craftc .recipe.dyemax.s(result, fusion_len);
      this.entries.dyec   .recipe.dyemax.s(result, fusion_len);
      this.entries.dyelast.recipe.dyemax.s(result, fusion_len);
      // dyelen = fusion_len;
      this.entries.craftc .recipe.dyelen.s(result, fusion_len);
      this.entries.dyec   .recipe.dyelen.s(result, fusion_len);
      this.entries.dyelast.recipe.dyelen.s(result, fusion_len);
      
      // handle dyemax;
      for(let i = 0; i < JE.dyemax; i++){
        const dyemax_entries = this.entries.dyelim[i];
        this.recipes.dyelim[i].add(result);
        dyemax_entries.recipe.craftc.s(result, 1);
        dyemax_entries.recipe.dyec  .s(result, fusion_len);
        dyemax_entries.recipe.dyemax.s(result, fusion_len);
        dyemax_entries.recipe.dyelen.s(result, fusion_len);
      }
      
      // build the base queue;
      this.next_queue.s(result, 1);
    }
    
    const base_queue = this.next_queue;
    // this does not modify base_queue;
    this.update_queue();
    
    // craftc search; -- ensures we find the minimum crafts for all colors;
    const craftc_search = () => {
      // set max_craftc high if you want to find more recipes and are confident there will not be an infinite loop;
      let max_craftc = 10;
      let curr_craftc = 1;
      while(curr_craftc <= max_craftc){
        let did_something = false;
        for(let i = 0; i < 64*64*64*64; i++){
          if(this.curr_queue.g(i)){
            did_something = true;
            this.mixes(i);
          }
        }
        // this is the normal return case; it signifies that we are done;
        if(!did_something){
          break;
        }
      }
      this.update_queue();
    }
    
    this.mixing.craftc = true;
    craftc_search();
    
    // split fusions into lists based on dye count;
    const split_fusions: UintData[] = [];
    for(let dye_count = 1; dye_count <= JE.dyemax; dye_count++){
      split_fusions.push(MakeData(JE.fusions.capacity, "int", "bit"));
    }
    for(let i = 0; i < JE.fusions.capacity; i++){
      if(this.curr_queue.g(i)){
        const dye_count = JE.fusions.i_len.g(i);
        // now just add the item to the right queue;
        split_fusions[dye_count - 1].s(i, 1);
      }
    }
    
    // dyec search; -- ensures we find the minimum dyes used total for all colors;
    this.mixing.craftc = false;
    this.mixing.dyec = true;
    // we will need multiple queues, one for each dye count from 1 to JE.dyemax;
    const queues: UintData[] = [];
    // set this.curr_queue to base_queue; do 1 dye search, fill this.next_queue, push that to queue 1, set this.next_queue to new queue;
    // set this.curr_queue to base_queue; do 2 dye search, fill this.next_queue, push that to queue 2, set this.next_queue to new queue;
    // ...
    // this.next_queue is now a useless empty queue;
    // check to see if all queues are empty; if so, end;
    // set this.curr_queue to queue 1;
    // set this.next_queue to queue 2;
    // delete queue 1 with shift;
    // add new queue 8 with push;
    // repeat until all queues are empty, or until you are satisfied;
    
    // convert split fusions into the queues format;
    for(let dye_count = 1; dye_count <= JE.dyemax; dye_count++){
      const target = MakeData(64*64*64*64, "int", "bit");
      for(let i = 0; i < JE.fusions.capacity; i++){
        if(split_fusions[dye_count - 1].g(i)){
          // yay i'm repeating code!
          // get the color that the fusion makes on its own;
          const fusion = JE.fusions.i.g(i);
          const fusion_len = JE.fusions.i_len.g(i);
          const colors = [
            (fusion >> 28) & 0xf,
            (fusion >> 24) & 0xf,
            (fusion >> 20) & 0xf,
            (fusion >> 16) & 0xf,
            (fusion >> 12) & 0xf,
            (fusion >>  8) & 0xf,
            (fusion >>  4) & 0xf,
            (fusion      ) & 0xf,
          ].slice(0, fusion_len);
          const result = JE.merge(
            JE.mix(...colors.map(
              idx => JE.split(JE.colors[idx])
            ))
          );
          // actually add to target now;
          target.s(result, 1);
        }
      }
      queues[dye_count - 1] = target;
    }
    
    // now begin the process;
    let max_dyec = 10;
    let curr_dyec = 1;
    while(curr_dyec <= max_dyec){
      let did_something = false;
      
      this.next_queue = queues[0];
      this.update_queue();
      // remove old queue;
      queues.shift();
      // add new empty queue;
      queues.push(MakeData(64*64*64*64, "int", "bit"));
      
      // now process the removed queue, while grabbing values to put in the other queues;
      for(let dye_count = 1; dye_count <= JE.dyemax; dye_count++){
        // "grab" results with the right number of dyes;
        this.next_queue = queues[dye_count - 1];
        for(let i = 0; i < 64*64*64*64; i++){
          if(this.curr_queue.g(i)){
            did_something = true;
            this.mixes(i, split_fusions[dye_count - 1]);
          }
        }
      }
      
      // count how many dyes have been used ''minimum'';
      curr_dyec++;
      
      // avoid one type of infinite loop;
      // you can still have infinite loops due to bugs in the code above;
      // those require actually fixing the bugs;
      if(!did_something){
        break;
      }
    }
    
    // finally, do dyemax search; -- ensures we find the minimum maximum dyes used in a single craft for all colors;
    this.mixing.dyec = false;
    this.mixing.dyelim = true;
    // now simply find the recipes for each limit of dyes per crafting step;
    for(let limit = 1; limit <= JE.dyemax; limit++){
      this.curr_queue = base_queue;
      this.mixing.dyelim_i = limit - 1;
      craftc_search();
    }
  }
}

export { test_fusions, SearchJE };
