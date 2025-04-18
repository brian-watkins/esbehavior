import { ClaimResult } from "../Claim.js"
import { Summary } from "../Summary.js"

export interface Writer {
  writeLine(message: string): void
}

export interface Failure {
  message?: string
  operator?: string
  expected?: any
  actual?: any
  stack?: string
}

export interface Reporter {
  start(orderDescription: string): void
  end(summary: Summary): void
  terminate(error: Failure): void

  startBehavior(description: string): void
  endBehavior(): void
  startExample(description?: string): void
  endExample(): void

  startScript(location: string): void
  endScript(): void

  recordPresupposition(result: ClaimResult): void
  recordAction(result: ClaimResult): void
  recordObservation(result: ClaimResult): void
}

export class NullReporter implements Reporter {
  start(): void {}
  end(summary: Summary): void {}
  terminate(error: Failure): void {}
  startBehavior(description: string): void {}
  endBehavior(): void {}
  startExample(description?: string): void {}
  endExample(): void {}
  startScript(location: string): void {}
  endScript(): void {}
  recordPresupposition(result: ClaimResult): void {}
  recordAction(result: ClaimResult): void {}
  recordObservation(result: ClaimResult): void {}
}