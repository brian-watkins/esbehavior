import { Reporter } from "./Reporter";
import { waitFor } from "./waitFor";

export interface Observation<T> {
  description: string
  observer(context: T): void | Promise<void>
}

export enum ObservationResult {
  Valid, Invalid
}

export class ObservationRunner<T> {
  constructor(private observation: Observation<T>, private reporter: Reporter) {}

  async run(context: T): Promise<ObservationResult> {
    try {
      await waitFor(this.observation.observer(context))
      this.reportOk()
      return ObservationResult.Valid
    } catch (err) {
      this.reportError(err)
      return ObservationResult.Invalid
    }
  }

  reportSkipped() {
    this.reporter.writeLine(`ok it ${this.observation.description} # SKIP`)
  }

  private reportOk() {
    this.reporter.writeLine(`ok it ${this.observation.description}`)
  }

  private reportError(err: any) {
    this.reporter.writeLine(`not ok it ${this.observation.description}`)
    this.reporter.writeLine('  ---')
    this.reporter.writeLine(`  operator: ${err.operator}`)
    this.reporter.writeLine(`  expected: ${err.expected}`)
    this.reporter.writeLine(`  actual:   ${err.actual}`)
    this.reporter.writeLine(`  stack: |-`)
    this.reporter.writeLine(`    ${err.stack}`)
    this.reporter.writeLine('  ...')
  }
}