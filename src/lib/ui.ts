import { SearchJE } from "./search";
import { FrameHandler } from "./frame";

export function load_page(
  search_instance_je: SearchJE,
  frame: FrameHandler
){
  
  // let search_instance_be = new SearchBE();
  // (window as any).search_instance_be = search_instance_be;

  document.body.addEventListener("keydown", (e) => {
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
  
  search_instance_je.main(frame.wait.bind(frame));
}


