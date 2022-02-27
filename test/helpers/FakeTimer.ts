import { Timer } from "../../src/Timer.js";

export class FakeTimer implements Timer {
  constructor(private time: string) {}
  
  start(): void {}
  stop(): void {}
  duration(): string {
    return this.time
  }
}