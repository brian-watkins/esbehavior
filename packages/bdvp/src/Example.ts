import { firstOf } from "./Maybe.js"
import { Reporter, writeComment } from "./Reporter.js"
import { addInvalid, addSkipped, addValid, emptySummary, Summary } from "./Summary.js"
import { validate, Claim, ignore } from "./Claim.js"
import { waitFor } from "./waitFor.js"
import { Effect } from "./Effect.js"
import { Condition } from "./Condition.js"

export interface Example {
  runMode: RunMode
  run(reporter: Reporter): Promise<Summary>
  skip(reporter: Reporter): Promise<Summary>
}

export interface Plan<T> {
  conditions: Array<Condition<T>>
  effects: Array<Effect<T>>
}

export interface Context<T> {
  subject: () => T | Promise<T>
  teardown?: (subject: T) => void | Promise<void>
}

export enum RunMode {
  Normal, Skipped, Picked
}

export class ExampleBuilder<T> {
  private example: BDVPExample<T>

  constructor (public runMode: RunMode, context: Context<T>) {
    this.example = new BDVPExample(runMode, context)
  }

  description(description: string): ExampleBuilder<T> {
    this.example.setDescription(description)
    return this
  }

  script({ assume = [], observe }: { assume?: Array<Condition<T>>, observe: Array<Effect<T>> }): ExampleBuilder<T> {
    this.example.setPlan({ conditions: assume, effects: observe })
    return this
  }

  build(): Example {
    return this.example
  }
}

export class BDVPExample<T> implements Example {
  private _description?: string
  private plans: Array<Plan<T>> = []

  constructor(public runMode: RunMode, public context: Context<T>) { }

  setDescription(description: string) {
    this._description = description
  }

  setPlan(plan: Plan<T>) {
    this.plans = [ plan ]
  }

  async run(reporter: Reporter): Promise<Summary> {
    if (this._description) {
      writeComment(reporter, this._description)
    }

    const subject = await waitFor(this.context.subject())

    const initialState = verifyConditions(subject, this.plans[0].conditions)

    const state = await this.execute(initialState, reporter)

    await waitFor(this.context.teardown?.(subject))

    return state.summary
  }

  async skip(reporter: Reporter): Promise<Summary> {
    if (this._description) {
      writeComment(reporter, this._description)
    }

    const initialState = skipAll([...this.plans[0].conditions, ...this.plans[0].effects])

    const state = await this.execute(initialState, reporter)

    return state.summary
  }

  private async execute(state: ExampleState<T>, reporter: Reporter): Promise<ExampleState<T>> {
    switch (state.type) {
      case "Verify":
        return firstOf(state.steps).map({
          nothing: () => {
            return this.execute(allObservations(state, this.plans[0].effects), reporter)
          },
          something: async (condition) => {
            const stepResult = await validate(condition, state.subject, reporter)
            return stepResult.map({
              valid: () => {
                const updated = summarize(state, addValid)
                return this.execute(remainingConditions(updated), reporter)
              },
              invalid: () => {
                const updated = summarize(state, addInvalid)
                return this.execute(skipRemainingClaims(updated, this.plans[0].effects), reporter)
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
            const observationResult = await validate(observation, state.subject, reporter)
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
  subject: T,
  summary: Summary,
  steps: Array<Claim<T>>
}

function verifyConditions<T>(subject: T, conditions: Array<Condition<T>>): Verify<T> {
  return {
    type: "Verify",
    subject: subject,
    steps: conditions,
    summary: emptySummary()
  }
}

function remainingConditions<T>(current: Verify<T>): Verify<T> {
  return {
    type: "Verify",
    subject: current.subject,
    steps: current.steps.slice(1),
    summary: current.summary
  }
}

interface Observe<T> {
  type: "Observe"
  subject: T,
  summary: Summary,
  steps: Array<Claim<T>>
}

function allObservations<T>(current: Verify<T>, observations: Array<Claim<T>>): Observe<T> {
  return {
    type: "Observe",
    steps: observations,
    subject: current.subject,
    summary: current.summary
  }
}

function remainingObservations<T>(current: Observe<T>): Observe<T> {
  return {
    type: "Observe",
    steps: current.steps.slice(1),
    subject: current.subject,
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