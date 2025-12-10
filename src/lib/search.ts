import { MakeData, UintData } from "./data";
import {
  JE, BE
} from "./editions";
import {
  FusionJE, FusionBE,
  FusionsJE
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

/**
 * Helper to add a dye to the using data (i.e. on a RecipesJE object). Returns whether it was already used.
 * @param using_i The using data to modify.
 * @param add_i The dye index to add.
 */
function add_using(using_i: [number], add_i: number){
  const using_it = ((using_i[0] >>> (0x1f - (add_i & 0xf))) & 1);
  using_i[0] |=  (1 << (0x1f - (add_i & 0xf)));
  return using_it;
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
    no_brown:      new JE.handler(this.entries.no_brown     ),
    only_roygbp:   new JE.handler(this.entries.only_roygbp  ),
    no_reps:       new JE.handler(this.entries.no_reps      ),
    no_reps_craft: new JE.handler(this.entries.no_reps_craft),
  }
  mixing = {
    craftc:  false,
    dyec:    false,
    dyelim:  false,
    dyelast: false,
    dyelim_i: 0,
  }
  fusions = JE.fusions;
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
  mixes(base: number){
    if(this.mixing.craftc){
      for(let i = 0; i < JE.fusions.idx; i++){
        const next = JE.fusions.mix(base, i);
        this.mix_craftc(base, next);
      }
    }
    if(this.mixing.dyec){
      for(let i = 0; i < JE.fusions.idx; i++){
        const next = JE.fusions.mix(base, i);
        this.mix_dyec(base, next);
      }
    }
    if(this.mixing.dyelim){
      for(let i = 0; i < JE.fusions.idx; i++){
        const next = JE.fusions.mix(base, i);
        this.mix_dyemax(base, next);
      }
    }
    if(this.mixing.dyelast){
      for(let i = 0; i < JE.fusions.idx; i++){
        const next = JE.fusions.mix(base, i);
        this.mix_dyelast(base, next);
      }
    }
  }
  main_step: (value: number | PromiseLike<number>) => void = function(){ return; };
  main_wait(): Promise<number> {
    return new Promise<number>((resolve) => {
      this.main_step = resolve;
    });
  }
  async main(){
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
      // useful mainly for no_reps and no_reps_craft;
      let using_i: [number] = [0];
      let has_reps = false;
      for(const c of colors){
        if(add_using(using_i, c)){
          has_reps = true;
        }
      }
      // build the base queue;
      this.next_queue.s(result, 1);
      
      // skip if already found;
      if(this.recipes.craftc.recipes.found.g(result)){
        continue;
      }
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
      // using = using_i[0];
      this.entries.craftc .recipe.using .s(result, using_i[0]);
      this.entries.dyec   .recipe.using .s(result, using_i[0]);
      this.entries.dyelast.recipe.using .s(result, using_i[0]);
      
      // handle dyemax;
      for(let i = 0; i < fusion_len; i++){
        const dyemax_entries = this.entries.dyelim[i];
        this.recipes.dyelim[i].add(result);
        dyemax_entries.recipe.craftc.s(result, 1);
        dyemax_entries.recipe.dyec  .s(result, fusion_len);
        dyemax_entries.recipe.dyemax.s(result, fusion_len);
        dyemax_entries.recipe.dyelen.s(result, fusion_len);
        dyemax_entries.recipe.using .s(result, using_i[0]);
      }
      
      // handle no_brown;
      if(!colors.includes(14)){
        this.recipes.no_brown.add(result);
        this.entries.no_brown.recipe.craftc.s(result, 1);
        this.entries.no_brown.recipe.dyec  .s(result, fusion_len);
        this.entries.no_brown.recipe.dyemax.s(result, fusion_len);
        this.entries.no_brown.recipe.dyelen.s(result, fusion_len);
        this.entries.no_brown.recipe.using .s(result, using_i[0]);
      }
      // handle only_roygbp;
      if(!(
        // just exclude non-roygbp colors;
        colors.includes(0)  || // exclude white;
        colors.includes(1)  || // exclude light_gray;
        colors.includes(2)  || // exclude gray;
        colors.includes(3)  || // exclude black;
        colors.includes(4)  || // exclude brown;
        colors.includes(8)  || // exclude lime;
        colors.includes(10) || // exclude cyan;
        colors.includes(11) || // exclude light_blue;
        colors.includes(14) || // exclude magenta;
        colors.includes(15)    // exclude pink;
      )){
        this.recipes.only_roygbp.add(result);
        this.entries.only_roygbp.recipe.craftc.s(result, 1);
        this.entries.only_roygbp.recipe.dyec  .s(result, fusion_len);
        this.entries.only_roygbp.recipe.dyemax.s(result, fusion_len);
        this.entries.only_roygbp.recipe.dyelen.s(result, fusion_len);
        this.entries.only_roygbp.recipe.using .s(result, using_i[0]);
      }
      // handle no_reps_craft;
      if(!has_reps){
        this.recipes.no_reps_craft.add(result);
        this.entries.no_reps_craft.recipe.craftc.s(result, 1);
        this.entries.no_reps_craft.recipe.dyec  .s(result, fusion_len);
        this.entries.no_reps_craft.recipe.dyemax.s(result, fusion_len);
        this.entries.no_reps_craft.recipe.dyelen.s(result, fusion_len);
        this.entries.no_reps_craft.recipe.using .s(result, using_i[0]);
      }
    }
    
    console.log("fusions added;");
    await this.main_wait();
    
    // split fusions into lists based on dye count;
    const split_fusions: FusionsJE[] = new Array(JE.dyemax).fill(null).map(
      () => JE.fusions.filter(
        fusion => fusion.i.length <= JE.dyemax
      )
    );
    
    console.log("fusion splitting done;");
    await this.main_wait();
    
    const base_queue = this.next_queue;
    // this does not modify base_queue;
    this.update_queue();
    
    // craftc search; -- ensures we find the minimum crafts for all colors;
    const craftc_search = () => {
      // set max_craftc high if you want to find more recipes and are confident there will not be an infinite loop;
      let max_craftc = 2;
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
        // advance to the next craft count iteration to avoid infinite loop
        curr_craftc++;
      }
      this.update_queue();
    }
    
    this.mixing.craftc = true;
    craftc_search();
    
    console.log("craftc search done;");
    await this.main_wait();
    
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
      const fusions = split_fusions[dye_count - 1];
      for(let i = 0; i < fusions.capacity; i++){
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
      queues[dye_count - 1] = target;
    }
    
    console.log("dyec queues ready;");
    await this.main_wait();
    
    // now begin the process;
    let max_dyec = 4;
    let curr_dyec = 1;
    // safety guards for repeated state and runaway processing
    let prev_curr_hash = -1;
    let repeat_hash_count = 0;
    while(curr_dyec <= max_dyec){
      let did_something = false;
      
      this.next_queue = queues[0];
      this.update_queue();
      // small checksum of current queue to detect repeated states
      try {
        const arr = (this.curr_queue as any).d as (number[] | undefined);
        let hash = 0;
        if(arr && arr.length){
          const len = Math.min(256, arr.length);
          for(let j = 0; j < len; j++) hash = (hash + (arr[j] | 0)) >>> 0;
        }
        if(hash === prev_curr_hash) repeat_hash_count++; else { prev_curr_hash = hash; repeat_hash_count = 0; }
        if(repeat_hash_count >= 3){
          console.warn("dyec loop aborted: repeated curr_queue state", { curr_dyec, repeat_hash_count, hash: prev_curr_hash });
          break;
        }
      } catch (e) {
        // best-effort only
      }

      // remove old queue;
      queues.shift();
      // add new empty queue;
      queues.push(MakeData(64*64*64*64, "int", "bit"));
      
      // now process the removed queue, while grabbing values to put in the other queues;
      let processedCount = 0;
      for(let dye_count = 1; dye_count <= JE.dyemax; dye_count++){
        this.fusions = split_fusions[dye_count - 1];
        // "grab" results with the right number of dyes;
        this.next_queue = queues[dye_count - 1];
        for(let i = 0; i < 64*64*64*64; i++){
          if(this.curr_queue.g(i)){
            did_something = true;
            processedCount++;
            // occasional progress log to avoid freezing without feedback
            if((processedCount & 0xffff) === 0) console.log(`dyec processing dye_count=${dye_count} processed=${processedCount}`);
            try {
              this.mixes(i);
            } catch (err) {
              console.log("Error while processing dyec loop", {
                curr_dyec, dye_count, i,
                err
              });
              return;
            }
            // safety cap to avoid extremely long processing loops
            if(processedCount > 5_000_000){
              console.warn("dyec loop aborted: processed item cap reached", { curr_dyec, processedCount });
              break;
            }
          }
        }
        if(processedCount > 5_000_000) break;
      }
      
      // count how many dyes have been used ''minimum'';
      curr_dyec++;
      
      console.log("dyec = " + curr_dyec + " search done;");
      await this.main_wait();
      
      // avoid one type of infinite loop;
      // you can still have infinite loops due to bugs in the code above;
      // those require actually fixing the bugs;
      if(!did_something){
        break;
      }
    }
    
    console.log("dyec search done;");
    await this.main_wait();
    
    // finally, do dyemax search; -- ensures we find the minimum maximum dyes used in a single craft for all colors;
    this.mixing.dyec = false;
    this.mixing.dyelim = true;
    // now simply find the recipes for each limit of dyes per crafting step;
    for(let limit = 1; limit <= JE.dyemax; limit++){
      this.curr_queue = base_queue;
      this.mixing.dyelim_i = limit - 1;
      craftc_search();
      
      console.log("dyemax = " + limit + " search done;");
      await this.main_wait();
    }
    
    // no_brown search;
    this.fusions = JE.fusions.filter(
      fusion => !(fusion.i.includes(14))
    );
    
    console.log("no_brown search done;");
    await this.main_wait();
    
    // only_roygbp search;
    this.fusions = JE.fusions.filter(
      fusion => !(
        // just exclude non-roygbp colors;
        fusion.i.includes(0)  || // exclude white;
        fusion.i.includes(1)  || // exclude light_gray;
        fusion.i.includes(2)  || // exclude gray;
        fusion.i.includes(3)  || // exclude black;
        fusion.i.includes(4)  || // exclude brown;
        fusion.i.includes(8)  || // exclude lime;
        fusion.i.includes(10) || // exclude cyan;
        fusion.i.includes(11) || // exclude light_blue;
        fusion.i.includes(14) || // exclude magenta;
        fusion.i.includes(15)    // exclude pink;
      )
    );
    
    console.log("only_roygbp search done;");
    await this.main_wait();
    
    // no_reps search;
    this.fusions = JE.fusions.filter(
      fusion => {
        let using_i: [number] = [0];
        let has_reps = false;
        for(const c of fusion.i){
          if(add_using(using_i, c)){
            has_reps = true;
          }
        }
        return !has_reps;
      }
    );
    
    console.log("no_reps search done;");
    await this.main_wait();
    
    // no_reps_craft search;
    // uses the same this.fusions as no_reps;
    
    console.log("no_reps_craft search done;");
    await this.main_wait();
    
  }
}

export { test_fusions, SearchJE };
