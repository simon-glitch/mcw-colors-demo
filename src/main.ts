
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

class FrameHandler {
  private _res_step_i: (value: number | PromiseLike<number>) => void = async function(){ return; };
  private _res_wait: (value: number | PromiseLike<number>) => void = function(){ return; };
  private async _step_i(steps: number): Promise<number> {
    this._res_step_i(0);
    return new Promise<number>((resolve) => {
      this._res_step_i = resolve;
    });
  };
  /**
   * Tell the search.main to step forward.
   * @param steps number of times to automatically step the search forward;
   */
  async step(steps: number): Promise<number> {
    for(let i = 0; i < steps; i++){
      this._res_wait(i);
      await this._step_i(i);
    }
    return steps;
  };
  /**
   * Used in main to wait for a signal from main_step, which indicates when main should continue.
   * @returns promise that resolves when main_step signals to continue;
   */
  wait_step(): Promise<number> {
    this._res_step_i(0);
    return new Promise<number>((resolve) => {
      this._res_wait = resolve;
    });
  }
  _wait_time = new Date;
  /** What proportion of `this.mspf` to allow `this.main` to run for before waiting for the next call of `this.step`. Should be between 0 and 1. */
  _wait_time_prop = 0.5;
  wait(): Promise<number> | number {
    const now = new Date;
    if(+now - +this._wait_time >= this._wait_time_prop * this.mspf){
      this._wait_time = now;
      return this.wait_step();
    }
    return 1;
  }
  playing: boolean = false;
  mspf: number = 1000 / 60;
  frame_id: number = -1;
  play(): void {
    if(this.playing || this.frame_id !== -1) return;
    this.playing = true;
    this.frame_id = window.setInterval(() => {
      this._res_wait(1);
    }, this.mspf);
  }
  pause(): void {
    if(!this.playing || this.frame_id === -1) return;
    this.playing = false;
    window.clearInterval(this.frame_id);
    this.frame_id = -1;
  }
}

const frame = new FrameHandler();
(window as any).frame = frame;
let search_instance_je: SearchJE;

// let search_instance_be = new SearchBE();
// (window as any).search_instance_be = search_instance_be;

window.addEventListener("keydown", (e) => {
  if(e.key === "d"){
    if(frame.playing){
      frame.pause();
    }
    else{
      frame.play();
    }
  }
});

document.getElementById("btn_play")!.onclick = () => {
  frame.play();
}
document.getElementById("btn_pause")!.onclick = () => {
  frame.pause();
}

const input_recipe = document.getElementById("input_recipe");
const input_recipe_set = document.getElementById("input_recipe_set");
const input_recipe_set_i = document.getElementById("input_recipe_set_i");
const output_recipe = document.getElementById("output_recipe");
const output_recipe_set = document.getElementById("output_recipe_set");

// why do I have to add error handling?
// what is wrong with me?
// I love error handling, that is why!
function get_recipe(): {recipe?: string, recipe_set?: string} {
  const recipe_set = (
    (input_recipe_set as HTMLInputElement)
    .value.toLowerCase()
  );
  const recipe_str = (
    (input_recipe as HTMLInputElement)
    .value.toLowerCase()
  );
  if(!(recipe_set in search_instance_je.recipes)){
    return {
      recipe_set: `Error: ${recipe_set} is not a valid recipe set.`
    };
  }
  
  let r = search_instance_je.recipes[recipe_set as keyof typeof search_instance_je.recipes];
  if(r instanceof Array){
    const recipe_set_i = Number(
      (input_recipe_set_i as HTMLInputElement)
      .value
    );
    if(Number.isNaN(recipe_set_i)){
      return {
        recipe_set: `Error: recipe_set_i is NaN.`
      };
    }
    if(!Number.isFinite(recipe_set_i)){
      return {
        recipe_set: `Error: recipe_set_i is infinite.`
      };
    }
    if(recipe_set_i < 0){
      return {
        recipe_set: `Error: recipe_set_i (value = ${recipe_set_i}) cannot be negative.`
      };
    }
    if(recipe_set_i >= r.length){
      return {
        recipe_set: `Error: recipe_set_i (value = ${recipe_set_i}) must be less than ${r.length}, because that is the number of recipes sets in "${recipe_set}".`
      };
    }
    if(recipe_set_i % 1){
      return {
        recipe_set: `Error: recipe_set_i (value = ${recipe_set_i}) must be an integer.`
      };
    }
    r = r[recipe_set_i];
  }
  const recipe = Number(recipe_str);
  let found_recipe = (
    (recipe_str === "random") ?
    r.random_recipe() :
    Number.isNaN(recipe) ?
    {recipe: `Error: ${recipe_str} is not a valid number or "random".`} :
    !Number.isFinite(recipe) ?
    {recipe: `Error: color cannot be infinite.`} :
    recipe < 0 ?
    {recipe: `Error: color (value = ${recipe_str}) value cannot be negative.`} :
    recipe >= 2**24 ?
    {recipe: `Error: color (value = ${recipe_str}) value cannot be 2^24 or greater.`} :
    recipe % 1 ?
    {recipe: `Error: color (value = ${recipe_str}) value must be an integer.`} :
    r.recipe(recipe)
  );
  return {
    recipe: JSON.stringify(found_recipe)
  };
}

document.getElementById("btn_recipe")!.onclick = () => {
  const result = get_recipe();
  if("recipe" in result){
    (output_recipe as HTMLInputElement).value = (result.recipe as string);
  }
  if("recipe_set" in result){
    (output_recipe_set as HTMLInputElement).value = (result.recipe_set as string);
  }
}

const _console_log = console.log;
console.log = function(){
  const log_output = document.getElementById("output_console") as HTMLTextAreaElement;
  log_output.innerText = Array.from(arguments).join(" ");
  _console_log.apply(console, arguments as any);
};

console.log("Page loaded.");

JE.fusions = JE.generate_fusions();

console.log("Fusions generated.");

search_instance_je = new SearchJE();
(window as any).search_instance_je = search_instance_je;
search_instance_je.main(frame.wait.bind(frame));


