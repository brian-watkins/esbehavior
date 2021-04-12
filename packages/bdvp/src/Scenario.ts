import { firstOf } from "./Maybe"
import { Reporter, writeComment } from "./Reporter"
import { addInvalid, addSkipped, addValid, emptySummary, Summary } from "./Summary"
import { runStep, ScenarioStep, skipStep } from "./ScenarioStep"
import { waitFor } from "./waitFor"
import { Fact } from "./Fact"

export interface Example {
  runMode: RunMode
  run(reporter: Reporter): Promise<Summary>
  skip(reporter: Reporter): Promise<Summary>
}

export interface Plan<T> {
  conditions(facts: Array<Fact<T>>): Plan<T>
  observations(facts: Array<Fact<T>>): Example
}

export interface Context<T> {
  generator: () => T | Promise<T>
}

export enum RunMode {
  Normal, Skipped, Picked
}

export class BDVPExample<T> implements Plan<T>, Example {
  private _conditions: Array<Fact<T>> = []
  private _observations: Array<Fact<T>> = []

  constructor(public description: string, public runMode: RunMode, public context: Context<T>) { }
  
  conditions(facts: Array<Fact<T>>): Plan<T> {
    this._conditions = facts
    return this
  }

  observations(facts: Array<Fact<T>>): Example {
    this._observations = facts
    return this
  }

  private async init(): Promise<ExampleState<T>> {
    return {
      type: "Verify",
      context: await waitFor(this.context.generator()),
      steps: this._conditions,
      summary: emptySummary()
    }
  }

  async run(reporter: Reporter): Promise<Summary> {
    writeComment(reporter, this.description)

    const initialState = await this.init()

    const state = await this.execute(initialState, reporter)

    return state.summary
  }

  async skip(reporter: Reporter): Promise<Summary> {
    writeComment(reporter, this.description)

    const initialState = skipAll([...this._conditions, ...this._observations])

    const state = await this.execute(initialState, reporter)

    return state.summary
  }

  private async execute(state: ExampleState<T>, reporter: Reporter): Promise<ExampleState<T>> {
    switch (state.type) {
      case "Verify":
        return firstOf(state.steps).map({
          nothing: () => {
            return this.execute(allObservations(state, this._observations), reporter)
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
                return this.execute(skipRemainingSteps(updated, this._observations), reporter)
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
}

type ExampleState<T>
  = Skip<T>
  | Verify<T>
  | Observe<T>
  | Complete

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

function complete<T>(model: ExampleState<T>): Complete {
  return { type: "Complete", summary: model.summary }
}

function summarize<T extends { summary: Summary }>(summarizable: T, summarizer: (summary: Summary) => Summary): T {
  return { ...summarizable, summary: summarizer(summarizable.summary) }
}