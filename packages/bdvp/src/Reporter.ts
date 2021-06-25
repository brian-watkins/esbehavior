import { ClaimResult } from "./Claim.js"
import { Condition } from "./Condition.js"
import { Effect } from "./Effect.js"
import { Summary } from "./Summary.js"

export interface Writer {
  writeLine(message: string): void
}

export class ConsoleWriter implements Writer {
  writeLine(message: string) {
    console.log(message)
  }
}

export interface Failure {
  operator: string
  expected: any
  actual: any
  stack: string
}

export interface Reporter {
  start(): void
  end(summary: Summary): void
  terminate(error: Failure): void

  startBehavior(description: string): void
  endBehavior(): void
  startExample(description?: string): void
  endExample(): void

  recordAssumption<T>(condition: Condition<T>, result: ClaimResult): void
  skipAssumption<T>(condition: Condition<T>): void
  
  recordObservation<T>(effect: Effect<T>, result: ClaimResult): void
  skipObservation<T>(effect: Effect<T>): void
}
