import { firstOf } from "./Maybe.js"
import { Reporter } from "./Reporter.js"
import { addInvalid, addSkipped, addSummary, addValid, emptySummary, Summary } from "./Summary.js"
import { Claim } from "./Claim.js"
import { waitFor } from "./waitFor.js"
import { Effect } from "./Effect.js"
import { Condition } from "./Condition.js"

export interface Example {
  runMode: RunMode
  run(reporter: Reporter): Promise<Summary>
  skip(reporter: Reporter): Promise<Summary>
}

export interface Script<T> {
  conditions: Array<Condition<T>>
  effects: Array<Effect<T>>
}

export interface Context<T> {
  init: () => T | Promise<T>
  teardown?: (context: T) => void | Promise<void>
}

export enum RunMode {
  Normal, Skipped, Picked
}

export interface ExampleBuilder<T> {
  build(): Example
}

export interface ExampleSetupBuilder<T> extends ExampleBuilder<T> {
  description(description: string): ExampleScriptBuilder<T>
  script({ assume, observe }: { assume?: Array<Condition<T>>, observe: Array<Effect<T>> }): ExampleScriptsBuilder<T>
}

export interface ExampleScriptBuilder<T> extends ExampleBuilder<T> {
  script({ assume, observe }: { assume?: Array<Condition<T>>, observe: Array<Effect<T>> }): ExampleScriptsBuilder<T>
}

export interface ExampleScriptsBuilder<T> extends ExampleBuilder<T> {
  andThen({ assume, observe }: { assume?: Array<Condition<T>>, observe: Array<Effect<T>> }): ExampleScriptsBuilder<T>
}

export class BDVPExampleBuilder<T> implements ExampleBuilder<T>, ExampleSetupBuilder<T>, ExampleScriptBuilder<T>, ExampleScriptsBuilder<T> {
  private example: BDVPExample<T>

  constructor (public runMode: RunMode, context: Context<T>) {
    this.example = new BDVPExample(runMode, context)
  }

  description(description: string): ExampleScriptBuilder<T> {
    this.example.setDescription(description)
    return this
  }

  script({ assume = [], observe }: { assume?: Array<Condition<T>>, observe: Array<Effect<T>> }): ExampleScriptsBuilder<T> {
    this.example.setScript({ conditions: assume, effects: observe })
    return this
  }

  andThen({ assume = [], observe }: { assume?: Array<Condition<T>>, observe: Array<Effect<T>> }): ExampleScriptsBuilder<T> {
    this.example.addScript({ conditions: assume, effects: observe })
    return this
  }

  build(): Example {
    return this.example
  }
}

export class BDVPExample<T> implements Example {
  private description?: string
  private scripts: Array<Script<T>> = []

  constructor(public runMode: RunMode, public context: Context<T>) { }

  setDescription(description: string) {
    this.description = description
  }

  setScript(script: Script<T>) {
    this.scripts = [ script ]
  }

  addScript(script: Script<T>) {
    this.scripts.push(script)
  }

  async run(reporter: Reporter): Promise<Summary> {
    reporter.startExample(this.description)

    const context = await waitFor(this.context.init())

    const state = await this.execute(runNext(context, this.scripts), reporter)

    await waitFor(this.context.teardown?.(context))

    return state.summary
  }

  async skip(reporter: Reporter): Promise<Summary> {
    reporter.startExample(this.description)

    const state = await this.execute(skipNext(this.scripts), reporter)

    return state.summary
  }

  private async execute(state: ExampleState<T>, reporter: Reporter): Promise<ExampleState<T>> {
    switch (state.type) {
      case "RunNext":
        return firstOf(state.scripts).on({
          nothing: async () => {
            return finish(state)
          },
          something: async (script) => {
            const initialState = verifyConditions(state.context, script)
            const scriptResult = await this.executeScript(initialState, reporter)

            const updated = summarize(state, addSummary(scriptResult.summary))

            if (scriptResult.summary.invalid > 0) {
              return this.execute(skipRemainingScripts(updated), reporter)
            }

            return this.execute(runRemaining(updated), reporter)
          }
        })
      case "SkipNext":
        return firstOf(state.scripts).on({
          nothing: async () => {
            return finish(state)
          },
          something: async (script) => {
            const scriptResult = await this.executeScript(skip(script), reporter)

            const updated = summarize(state, addSummary(scriptResult.summary))

            return this.execute(skipRemainingScripts(updated), reporter)
          }
        })
      case "Finish":
        return state
    }
  }

  private async executeScript(state: ScriptState<T>, reporter: Reporter): Promise<ScriptState<T>> {
    switch (state.type) {
      case "Verify":
        return firstOf(state.conditions).on({
          nothing: () => {
            return this.executeScript(allObservations(state), reporter)
          },
          something: async (condition) => {
            const assumptionResult = await condition.validate(state.context)
            reporter.recordAssumption(condition, assumptionResult)
            return assumptionResult.when({
              valid: () => {
                const updated = summarize(state, addValid)
                return this.executeScript(remainingConditions(updated), reporter)
              },
              invalid: () => {
                const updated = summarize(state, addInvalid)
                return this.executeScript(skipRemainingAssumptions(updated), reporter)
              }
            })
          }
        })
      case "Observe":
        return firstOf(state.effects).on({
          nothing: () => {
            return this.executeScript(complete(state), reporter)
          },
          something: async (effect) => {
            const observationResult = await effect.validate(state.context)
            reporter.recordObservation(effect, observationResult)
            return observationResult.when({
              valid: () => {
                const updated = summarize(state, addValid)
                return this.executeScript(remainingObservations(updated), reporter)
              },
              invalid: () => {
                const updated = summarize(state, addInvalid)
                return this.executeScript(remainingObservations(updated), reporter)
              }
            })
          }
        })
      case "SkipAssumptions":
        return firstOf(state.conditions).on({
          nothing: () => {
            return this.executeScript(skipObservations(state), reporter)
          },
          something: (condition) => {
            reporter.skipAssumption(condition)
            const updated = summarize(state, addSkipped)
            return this.executeScript(skipRemainingAssumptions(updated), reporter)
          }
        })
      case "SkipObservations":
        return firstOf(state.observations).on({
          nothing: () => {
            return this.executeScript(complete(state), reporter)
          },
          something: (effect) => {
            reporter.skipObservation(effect)
            const updated = summarize(state, addSkipped)
            return this.executeScript(skipRemainingObservations(updated), reporter)
          }
        })
      case "Complete":
        return state
    }
  }
}

type ExampleState<T>
  = RunNext<T>
  | SkipNext<T>
  | Finish

interface Finish {
  type: "Finish",
  summary: Summary
}

function finish<T>(state: ExampleState<T>): Finish {
  return {
    type: "Finish",
    summary: state.summary
  }
}

interface RunNext<T> {
  type: "RunNext",
  context: T,
  scripts: Array<Script<T>>
  summary: Summary
}

function runNext<T>(context: T, scripts: Array<Script<T>>): RunNext<T> {
  return {
    type: "RunNext",
    context,
    scripts,
    summary: emptySummary()
  }
}

function runRemaining<T>(state: RunNext<T>): RunNext<T> {
  return {
    type: "RunNext",
    context: state.context,
    scripts: state.scripts.slice(1),
    summary: state.summary
  }
}

interface SkipNext<T> {
  type: "SkipNext",
  scripts: Array<Script<T>>
  summary: Summary
}

function skipNext<T>(scripts: Array<Script<T>>): SkipNext<T> {
  return {
    type: "SkipNext",
    scripts,
    summary: emptySummary()
  }
}

function skipRemainingScripts<T>(state: { scripts: Array<Script<T>>, summary: Summary }): SkipNext<T> {
  return {
    type: "SkipNext",
    scripts: state.scripts.slice(1),
    summary: state.summary
  }
}

type ScriptState<T>
  = SkipAssumptions<T>
  | SkipObservations<T>
  | Verify<T>
  | Observe<T>
  | Complete

interface SkipAssumptions<T> {
  type: "SkipAssumptions",
  script: Script<T>,
  summary: Summary,
  conditions: Array<Condition<T>>
}

function skip<T>(script: Script<T>): SkipAssumptions<T> {
  return {
    type: "SkipAssumptions",
    script,
    summary: emptySummary(),
    conditions: script.conditions
  }
}

interface Skippable<T> {
  script: Script<T>,
  summary: Summary,
  conditions: Array<Condition<T>>
}

function skipRemainingAssumptions<T>(current: Skippable<T>): SkipAssumptions<T> {
  return {
    type: "SkipAssumptions",
    script: current.script,
    summary: current.summary,
    conditions: current.conditions.slice(1)
  }
}

interface SkipObservations<T> {
  type: "SkipObservations",
  script: Script<T>,
  summary: Summary,
  observations: Array<Effect<T>>
}

function skipObservations<T>(current: SkipAssumptions<T>): SkipObservations<T> {
  return {
    type: "SkipObservations",
    script: current.script,
    summary: current.summary,
    observations: current.script.effects
  }
}

function skipRemainingObservations<T>(current: SkipObservations<T>): SkipObservations<T> {
  return {
    type: "SkipObservations",
    script: current.script,
    summary: current.summary,
    observations: current.observations.slice(1)
  }
}

interface Verify<T> {
  type: "Verify"
  context: T,
  script: Script<T>,
  summary: Summary,
  conditions: Array<Claim<T>>
}

function verifyConditions<T>(context: T, script: Script<T>): Verify<T> {
  return {
    type: "Verify",
    context: context,
    script: script,
    conditions: script.conditions,
    summary: emptySummary()
  }
}

function remainingConditions<T>(current: Verify<T>): Verify<T> {
  return {
    type: "Verify",
    context: current.context,
    script: current.script,
    conditions: current.conditions.slice(1),
    summary: current.summary
  }
}

interface Observe<T> {
  type: "Observe"
  context: T,
  script: Script<T>,
  summary: Summary,
  effects: Array<Claim<T>>
}

function allObservations<T>(current: Verify<T>): Observe<T> {
  return {
    type: "Observe",
    effects: current.script.effects,
    context: current.context,
    script: current.script,
    summary: current.summary
  }
}

function remainingObservations<T>(current: Observe<T>): Observe<T> {
  return {
    type: "Observe",
    effects: current.effects.slice(1),
    context: current.context,
    script: current.script,
    summary: current.summary
  }
}

interface Complete {
  type: "Complete"
  summary: Summary
}

function complete<T>(model: ScriptState<T>): Complete {
  return { type: "Complete", summary: model.summary }
}

function summarize<T extends { summary: Summary }>(summarizable: T, summarizer: (summary: Summary) => Summary): T {
  return { ...summarizable, summary: summarizer(summarizable.summary) }
}