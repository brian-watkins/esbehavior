import { Reporter } from "./Reporter";
import { waitFor } from "./waitFor";

export interface Observation<T> {
  description: string
  observer(context: T): void | Promise<void>
}

export class ObservationRunner<T> {
  constructor(private id: number, private observation: Observation<T>, private reporter: Reporter) {}

  async run(context: T): Promise<void> {
    try {
      await waitFor(this.observation.observer(context))
      this.reportOk()
    } catch (err) {
      this.reportError(err)
    }
  }

  private reportOk() {
    this.reporter.writeLine(`ok ${this.id} it ${this.observation.description}`)
  }

  private reportError(err: any) {
    this.reporter.writeLine(`not ok ${this.id} it ${this.observation.description}`)
    this.reporter.writeLine('  ---')
    this.reporter.writeLine(`  operator: ${err.operator}`)
    this.reporter.writeLine(`  expected: ${err.expected}`)
    this.reporter.writeLine(`  actual:   ${err.actual}`)
    this.reporter.writeLine(`  stack: |-`)
    this.reporter.writeLine(`    ${err.stack}`)
    this.reporter.writeLine('  ...')
  }
}