
export class FrameHandler {
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

