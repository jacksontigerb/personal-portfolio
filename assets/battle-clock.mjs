// Only one pending callback. Suspensions preserve the remaining delay.
export class BattleClock {
  constructor({now = () => performance.now(), set = (fn, ms) => setTimeout(fn, ms), clear = id => clearTimeout(id)} = {}) {
    Object.assign(this, {now, set, clear});
    this.blocks = new Set();
    this.pending = null;
    this.timer = null;
    this.generation = 0;
  }
  cancel() {
    this.generation++;
    if (this.timer !== null) this.clear(this.timer);
    this.timer = null;
    this.pending = null;
  }
  after(ms, fn) {
    this.cancel();
    this.pending = {ms, fn};
    this.arm();
  }
  arm() {
    if (!this.pending || this.blocks.size || this.timer !== null) return;
    const generation = this.generation;
    this.deadline = this.now() + this.pending.ms;
    this.timer = this.set(() => {
      if (generation !== this.generation) return;
      const {fn} = this.pending;
      this.pending = null;
      this.timer = null;
      fn();
    }, this.pending.ms);
  }
  block(reason, blocked) {
    if (blocked) {
      if (this.blocks.has(reason)) return;
      this.blocks.add(reason);
      if (this.timer !== null) {
        this.pending.ms = Math.max(0, this.deadline - this.now());
        this.clear(this.timer);
        this.timer = null;
      }
    } else {
      this.blocks.delete(reason);
      this.arm();
    }
  }
}
