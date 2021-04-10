import { Condition } from "./Condition"
import { firstOf } from "./Maybe"
import { Observation } from "./Observation"
import { Reporter, writeComment, writeTestFailure, writeTestPass, writeTestSkip } from "./Reporter"
import { addInvalid, addSkipped, addValid, emptySummary, Summary } from "./Summary"
import { runStep, ScenarioStep } from "./ScenarioStep"
import { waitFor } from "./waitFor"

export interface Scenario {
  kind: ScenarioKind
  run(reporter: Reporter): Promise<Summary>
  skip(reporter: Reporter): Promise<Summary>
}

export interface Context<T> {
  generator: () => T | Promise<T>
}

export enum ScenarioKind {
  Normal, Skipped, Picked
}

export class Plan<T> {
  public conditions: Array<Condition<T>> = []
  public observations: Array<Observation<T>> = []

  constructor(public description: string, public kind: ScenarioKind, public context: Context<T>) { }

  when(description: string, run: (context: T) => void | Promise<void>): Plan<T> {
    this.conditions.push(new Condition(description, run))
    return this
  }

  observeThat(observations: Observation<T>[]): Scenario {
    this.observations = observations
    return new RunnableScenario(this)
  }
}

interface Skip<T> {
  type: "Skip",
  summary: Summary,
  steps: Array<ScenarioStep<T>>
}

function skip<T>(current: Verify<T>, observations: Array<ScenarioStep<T>>, resultsGenerator: (results: Summary) => Summary): Skip<T> {
  return {
    type: "Skip",
    steps: [ ...current.steps.slice(1), ...observations ],
    summary: resultsGenerator(current.summary)
  }
}

function skipRemaining<T>(current: Observe<T> | Skip<T>, resultsGenerator: (results: Summary) => Summary): Skip<T> {
  return {
    type: "Skip",
    steps: current.steps.slice(1),
    summary: resultsGenerator(current.summary)
  }
}

interface Verify<T> {
  type: "Verify"
  context: T,
  summary: Summary,
  steps: Array<ScenarioStep<T>>
}

function remainingConditions<T>(current: Verify<T>, resultsGenerator: (results: Summary) => Summary): Verify<T> {
  return {
    type: "Verify",
    context: current.context,
    steps: current.steps.slice(1),
    summary: resultsGenerator(current.summary)
  }
}

interface Observe<T> {
  type: "Observe"
  context: T,
  summary: Summary,
  steps: Array<ScenarioStep<T>>
}

function observations<T>(current: Verify<T>, observations: Array<ScenarioStep<T>>): Observe<T> {
  return {
    type: "Observe",
    steps: observations,
    context: current.context,
    summary: current.summary
  }
}

function remainingObservations<T>(current: Observe<T>, resultsGenerator: (results: Summary) => Summary): Observe<T> {
  return {
    type: "Observe",
    steps: current.steps.slice(1),
    context: current.context,
    summary: resultsGenerator(current.summary)
  }
}

interface Complete {
  type: "Complete"
  summary: Summary
}

function complete<T>(mode: ScenarioMode<T>): Complete {
  return { type: "Complete", summary: mode.summary }
}

type ScenarioMode<T>
  = Skip<T>
  | Verify<T>
  | Observe<T>
  | Complete

class RunnableScenario<T> implements Scenario {
  constructor(private plan: Plan<T>) { }

  get kind(): ScenarioKind {
    return this.plan.kind
  }

  private async initScenario(): Promise<ScenarioMode<T>> {
    return {
      type: "Verify",
      context: await waitFor(this.plan.context.generator()),
      steps: this.plan.conditions,
      summary: emptySummary()
    }
  }

  async run(reporter: Reporter): Promise<Summary> {
    writeComment(reporter, this.plan.description)

    const initialMode = await this.initScenario()

    const mode = await this.execute(initialMode, reporter)

    return mode.summary
  }

  private async execute(mode: ScenarioMode<T>, reporter: Reporter): Promise<ScenarioMode<T>> {
    switch (mode.type) {
      case "Verify":
        return firstOf(mode.steps).map({
          nothing: () => {
            return this.execute(observations(mode, this.plan.observations), reporter)
          },
          something: async (condition) => {
            const stepResult = await runStep(condition, mode.context)
            return stepResult.map({
              valid: () => {
                writeTestPass(reporter, condition.description)
                return this.execute(remainingConditions(mode, addValid), reporter)
              },
              invalid: (error) => {
                writeTestFailure(reporter, condition.description, error)
                return this.execute(skip(mode, this.plan.observations, addInvalid), reporter)
              }
            })
          }
        })
      case "Observe":
        return firstOf(mode.steps).map({
          nothing: () => {
            return this.execute(complete(mode), reporter)
          },
          something: async (observation) => {
            const observationResult = await runStep(observation, mode.context)
            return observationResult.map({
              valid: () => {
                writeTestPass(reporter, observation.description)
                return this.execute(remainingObservations(mode, addValid), reporter)
              },
              invalid: (error) => {
                writeTestFailure(reporter, observation.description, error)
                return this.execute(remainingObservations(mode, addInvalid), reporter)
              }
            })
          }
        })
      case "Skip":
        return firstOf(mode.steps).map({
          nothing: () => {
            return this.execute(complete(mode), reporter)
          },
          something: (step) => {
            writeTestSkip(reporter, step.description)
            return this.execute(skipRemaining(mode, addSkipped), reporter)
          }
        })
      case "Complete":
        return mode
    }
  }

  async skip(reporter: Reporter): Promise<Summary> {
    writeComment(reporter, this.plan.description)

    const steps = this.plan.conditions.concat(this.plan.observations)
    for (const step of steps) {
      writeTestSkip(reporter, step.description)
    }

    return {
      invalid: 0,
      valid: 0,
      skipped: steps.length
    }
  }
}