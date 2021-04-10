import { Failure } from "./Reporter"
import { waitFor } from "./waitFor"

export interface ScenarioStep<T> {
  description: string
  run(context: T): void | Promise<void>
}

export interface StepResultMapper<S> {
  valid(): S
  invalid(error: Failure): S
}

export class ValidStep {
  public type = "Valid"

  map<S>(mapper: StepResultMapper<S>): S {
    return mapper.valid()
  }
}

export class InvalidStep {
  public type = "Invalid"
  constructor (public error: Failure) {}

  map<S>(mapper: StepResultMapper<S>): S {
    return mapper.invalid(this.error)
  }
}

export type StepResult = ValidStep | InvalidStep

export async function runStep<T>(step: ScenarioStep<T>, context: T): Promise<StepResult> {
  try {
    await waitFor(step.run(context))
    return new ValidStep()
  } catch (err) {
    return new InvalidStep(err)
  }
}