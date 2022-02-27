import { Assumption } from "./Assumption.js"
import { ClaimResult } from "./Claim.js"
import { Effect } from "./Effect.js"
import { Summary } from "./Summary.js"

export interface Writer {
  writeLine(message: string): void
}

export interface Failure {
  operator?: string
  expected?: any
  actual?: any
  stack?: string
}

export interface Reporter {
  start(): void
  end(summary: Summary): void
  terminate(error: Failure): void

  startBehavior(description: string): void
  endBehavior(): void
  startExample(description?: string): void
  endExample(): void

  recordAssumption<T>(assumption: Assumption<T>, result: ClaimResult): void
  skipAssumption<T>(assumption: Assumption<T>): void
  
  recordObservation<T>(effect: Effect<T>, result: ClaimResult): void
  skipObservation<T>(effect: Effect<T>): void
}
