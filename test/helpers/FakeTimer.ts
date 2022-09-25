import { Timer } from "../../src/Timer.js";

export class FakeTimer implements Timer {
  constructor(private time: number) {}
  
  start(): void {}
  stop(): void {}
  durationInMillis(): number {
    return this.time
  }
}

export function fakeTimer(duration: number): FakeTimer {
  return new FakeTimer(duration)
}