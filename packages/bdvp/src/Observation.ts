import { Reporter, writeTestFailure, writeTestPass, writeTestSkip } from "./Reporter";
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
    writeTestSkip(this.reporter, `it ${this.observation.description}`)
  }

  private reportOk() {
    writeTestPass(this.reporter, `it ${this.observation.description}`)
  }

  private reportError(err: any) {
    writeTestFailure(this.reporter, `it ${this.observation.description}`, err)
  }
}