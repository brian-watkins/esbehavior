import { Reporter, writeTestFailure, writeTestPass, writeTestSkip } from "./Reporter";
import { waitFor } from "./waitFor";

export interface Condition<T> {
  description: string
  run(context: T): void | Promise<void>
}

export enum ConditionResult {
  Pass, Fail
}

export class ConditionRunner<T> {
  constructor(private condition: Condition<T>, private reporter: Reporter) {}

  async run(context: T): Promise<ConditionResult> {
    try {
      await waitFor(this.condition.run(context))
      this.reportOk()
      return ConditionResult.Pass
    } catch (err) {
      this.reportError(err)
      return ConditionResult.Fail
    }
  }

  reportSkipped() {
    writeTestSkip(this.reporter, `when ${this.condition.description}`)
  }

  private reportOk() {
    writeTestPass(this.reporter, `when ${this.condition.description}`)
  }

  private reportError(err: any) {
    writeTestFailure(this.reporter, `when ${this.condition.description}`, err)
  }
}