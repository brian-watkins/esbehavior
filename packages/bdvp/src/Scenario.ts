import { Condition } from "./Condition"
import { firstOf } from "./Maybe"
import { Observation } from "./Observation"
import { Reporter, writeComment } from "./Reporter"
import { addInvalid, addSkipped, addValid, emptySummary, Summary } from "./Summary"
import { runStep, ScenarioStep, skipStep } from "./ScenarioStep"
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

function skipAll<T>(steps: Array<ScenarioStep<T>>): Skip<T> {
  return {
    type: "Skip",
    steps: steps,
    summary: emptySummary()
  }
}

function skipRemainingSteps<T>(current: Verify<T>, observations: Array<ScenarioStep<T>>): Skip<T> {
  return {
    type: "Skip",
    steps: [ ...current.steps.slice(1), ...observations ],
    summary: current.summary
  }
}

function skipRemaining<T>(current: Observe<T> | Skip<T>): Skip<T> {
  return {
    type: "Skip",
    steps: current.steps.slice(1),
    summary: current.summary
  }
}

interface Verify<T> {
  type: "Verify"
  context: T,
  summary: Summary,
  steps: Array<ScenarioStep<T>>
}

function remainingConditions<T>(current: Verify<T>): Verify<T> {
  return {
    type: "Verify",
    context: current.context,
    steps: current.steps.slice(1),
    summary: current.summary
  }
}

interface Observe<T> {
  type: "Observe"
  context: T,
  summary: Summary,
  steps: Array<ScenarioStep<T>>
}

function allObservations<T>(current: Verify<T>, observations: Array<ScenarioStep<T>>): Observe<T> {
  return {
    type: "Observe",
    steps: observations,
    context: current.context,
    summary: current.summary
  }
}

function remainingObservations<T>(current: Observe<T>): Observe<T> {
  return {
    type: "Observe",
    steps: current.steps.slice(1),
    context: current.context,
    summary: current.summary
  }
}

interface Complete {
  type: "Complete"
  summary: Summary
}

function complete<T>(mode: ScenarioState<T>): Complete {
  return { type: "Complete", summary: mode.summary }
}

type ScenarioState<T>
  = Skip<T>
  | Verify<T>
  | Observe<T>
  | Complete

function summarize<T extends { summary: Summary }>(summarizable: T, summarizer: (summary: Summary) => Summary): T {
  return { ...summarizable, summary: summarizer(summarizable.summary) }
}

class RunnableScenario<T> implements Scenario {
  constructor(private plan: Plan<T>) { }

  get kind(): ScenarioKind {
    return this.plan.kind
  }

  private async init(): Promise<ScenarioState<T>> {
    return {
      type: "Verify",
      context: await waitFor(this.plan.context.generator()),
      steps: this.plan.conditions,
      summary: emptySummary()
    }
  }

  async run(reporter: Reporter): Promise<Summary> {
    writeComment(reporter, this.plan.description)

    const initialState = await this.init()

    const state = await this.execute(initialState, reporter)

    return state.summary
  }

  private async execute(state: ScenarioState<T>, reporter: Reporter): Promise<ScenarioState<T>> {
    switch (state.type) {
      case "Verify":
        return firstOf(state.steps).map({
          nothing: () => {
            return this.execute(allObservations(state, this.plan.observations), reporter)
          },
          something: async (condition) => {
            const stepResult = await runStep(condition, state.context, reporter)
            return stepResult.map({
              valid: () => {
                const updated = summarize(state, addValid)
                return this.execute(remainingConditions(updated), reporter)
              },
              invalid: () => {
                const updated = summarize(state, addInvalid)
                return this.execute(skipRemainingSteps(updated, this.plan.observations), reporter)
              }
            })
          }
        })
      case "Observe":
        return firstOf(state.steps).map({
          nothing: () => {
            return this.execute(complete(state), reporter)
          },
          something: async (observation) => {
            const observationResult = await runStep(observation, state.context, reporter)
            return observationResult.map({
              valid: () => {
                const updated = summarize(state, addValid)
                return this.execute(remainingObservations(updated), reporter)
              },
              invalid: () => {
                const updated = summarize(state, addInvalid)
                return this.execute(remainingObservations(updated), reporter)
              }
            })
          }
        })
      case "Skip":
        return firstOf(state.steps).map({
          nothing: () => {
            return this.execute(complete(state), reporter)
          },
          something: (step) => {
            skipStep(step, reporter)
            const updated = summarize(state, addSkipped)
            return this.execute(skipRemaining(updated), reporter)
          }
        })
      case "Complete":
        return state
    }
  }

  async skip(reporter: Reporter): Promise<Summary> {
    writeComment(reporter, this.plan.description)

    const initialState = skipAll([...this.plan.conditions, ...this.plan.observations])
    
    const state = await this.execute(initialState, reporter)

    return state.summary
  }
}