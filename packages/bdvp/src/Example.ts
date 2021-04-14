import { firstOf } from "./Maybe"
import { Reporter, writeComment } from "./Reporter"
import { addInvalid, addSkipped, addValid, emptySummary, Summary } from "./Summary"
import { validate, Claim, ignore } from "./Claim"
import { waitFor } from "./waitFor"
import { Effect } from "./Effect"
import { Condition } from "./Condition"

export interface Example {
  runMode: RunMode
  run(reporter: Reporter): Promise<Summary>
  skip(reporter: Reporter): Promise<Summary>
}

export interface Plan<T> {
  require(conditions: Array<Condition<T>>): Plan<T>
  observe(effects: Array<Effect<T>>): Example
}

export interface Context<T> {
  generator: () => T | Promise<T>
  teardown?: (context: T) => void
}

export enum RunMode {
  Normal, Skipped, Picked
}

export class BDVPExample<T> implements Plan<T>, Example {
  private _conditions: Array<Condition<T>> = []
  private _effects: Array<Effect<T>> = []

  constructor(public description: string, public runMode: RunMode, public context: Context<T>) { }
  
  require(conditions: Array<Condition<T>>): Plan<T> {
    this._conditions = conditions
    return this
  }

  observe(effects: Array<Effect<T>>): Example {
    this._effects = effects
    return this
  }

  async run(reporter: Reporter): Promise<Summary> {
    writeComment(reporter, this.description)

    const context = await waitFor(this.context.generator())

    const initialState = verifyConditions(context, this._conditions)

    const state = await this.execute(initialState, reporter)

    this.context.teardown?.(context)

    return state.summary
  }

  async skip(reporter: Reporter): Promise<Summary> {
    writeComment(reporter, this.description)

    const initialState = skipAll([...this._conditions, ...this._effects])

    const state = await this.execute(initialState, reporter)

    return state.summary
  }

  private async execute(state: ExampleState<T>, reporter: Reporter): Promise<ExampleState<T>> {
    switch (state.type) {
      case "Verify":
        return firstOf(state.steps).map({
          nothing: () => {
            return this.execute(allObservations(state, this._effects), reporter)
          },
          something: async (condition) => {
            const stepResult = await validate(condition, state.context, reporter)
            return stepResult.map({
              valid: () => {
                const updated = summarize(state, addValid)
                return this.execute(remainingConditions(updated), reporter)
              },
              invalid: () => {
                const updated = summarize(state, addInvalid)
                return this.execute(skipRemainingClaims(updated, this._effects), reporter)
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
            const observationResult = await validate(observation, state.context, reporter)
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
            ignore(step, reporter)
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
  steps: Array<Claim<T>>
}

function skipAll<T>(steps: Array<Claim<T>>): Skip<T> {
  return {
    type: "Skip",
    steps: steps,
    summary: emptySummary()
  }
}

function skipRemainingClaims<T>(current: Verify<T>, observations: Array<Claim<T>>): Skip<T> {
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
  steps: Array<Claim<T>>
}

function verifyConditions<T>(context: T, conditions: Array<Condition<T>>): Verify<T> {
  return {
    type: "Verify",
    context: context,
    steps: conditions,
    summary: emptySummary()
  }
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
  steps: Array<Claim<T>>
}

function allObservations<T>(current: Verify<T>, observations: Array<Claim<T>>): Observe<T> {
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