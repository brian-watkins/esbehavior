import { Failure, Reporter } from "./Reporter"
import { waitFor } from "./waitFor"

export interface ScenarioStep<T> {
  description: string
  run(context: T): void | Promise<void>
}

export interface ValidStep {
  type: "Valid"
}

function validStep(): ValidStep {
  return { type: "Valid" }
}

export interface InvalidStep {
  type: "Invalid"
  error: Failure
}

function invalidStep(error: Failure): InvalidStep {
  return { type: "Invalid", error }
}

export type StepResult = ValidStep | InvalidStep

export class StepRunner<T> {
  constructor(private step: ScenarioStep<T>, private reporter: Reporter) {}

  async run(context: T): Promise<StepResult> {
    try {
      await waitFor(this.step.run(context))
      return validStep()
    } catch (err) {
      return invalidStep(err)
    }
  }
}