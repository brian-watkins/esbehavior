import { BehaviorExampleBuilder, ExampleSetup } from "./Example.js"
import { Reporter } from "./reporter/index.js"
import { Behavior, ConfigurableBehavior, ConfigurableExample } from "./Behavior.js"
import { Effect, Observation, Outcome } from "./Observation.js"
import { Fact, Presupposition, Situation } from "./Presupposition.js"
import { StandardReporter } from "./reporter/StandardReporter.js"
import { emptySummary, Summary } from "./Summary.js"
import { Action, Procedure, Step } from "./Action.js"
import { Documentation, hasPickedExamples } from "./Documentation.js"
import { TimerFactory } from "./Timer.js"
import { DefaultOrderProvider, OrderProvider, SeededRandomizer } from "./OrderProvider.js"
import { Context } from "./Context.js"
export { Effect, Outcome } from "./Observation.js"
export type { Observation } from "./Observation.js"
export { Fact, Situation } from "./Presupposition.js"
export type { Presupposition } from "./Presupposition.js"
export { Procedure, Step } from "./Action.js"
export type { Action } from "./Action.js"
export type { Claim, ClaimResult, ValidClaim, InvalidClaim, SkippedClaim } from "./Claim.js"
export type { OrderProvider } from "./OrderProvider.js"
export { ExampleOptions, BehaviorOptions, ValidationMode } from "./Behavior.js"
export type { Behavior, ConfigurableBehavior, ConfigurableExample } from "./Behavior.js"
export type { Summary } from "./Summary.js"
export type { Reporter, Writer, Failure } from "./reporter/index.js"
export { StandardReporter } from "./reporter/StandardReporter.js"
export type { StandardReporterOptions } from "./reporter/StandardReporter.js"
export { ANSIFormatter } from "./reporter/formatter.js"
export type { Formatter } from "./reporter/formatter.js"
export { TAPReporter } from "./reporter/TAPReporter.js"
export type { Example, ExampleValidationOptions, ExampleSetup, ExampleScript, ExampleScripts } from "./Example.js"
export type { Context, ContextValues } from "./Context.js"
export { useWithContext, behaviorContext } from "./Context.js"
export type { Script } from "./Script.js"
export type { BehaviorValidationOptions } from "./behaviorRunner/index.js"
export { ValidationStatus, runBehavior } from "./behaviorRunner/run.js"

export interface ValidationOptions {
  reporter?: Reporter,
  order?: OrderProvider,
  failFast?: boolean
}

export async function validate(behaviors: Array<ConfigurableBehavior>, options: ValidationOptions = {}): Promise<Summary> {
  const reporter = options.reporter ?? new StandardReporter()

  const validationOptions = {
    reporter,
    failFast: options.failFast ?? false,
    orderProvider: options.order ?? new SeededRandomizer(),
    runPickedOnly: hasPickedExamples(behaviors)
  }

  const documentation = new Documentation(behaviors, validationOptions)

  try {
    const summary = await documentation.validate()
    return summary
  } catch (err: any) {
    reporter.terminate(err)
    return emptySummary()
  }
}

export function defaultOrder(): OrderProvider {
  return new DefaultOrderProvider()
}

export function randomOrder(seed?: string): OrderProvider {
  return new SeededRandomizer(seed)
}

export function behavior(description: string, examples: Array<ConfigurableExample>): Behavior {
  return {
    description,
    examples
  }
}

const voidContext: Context<any> = { init: () => { } }

export function example<T = void>(context: Context<T> = voidContext): ExampleSetup<T> {
  return new BehaviorExampleBuilder(context)
}

export function fact<T>(description: string, validate: (context: T) => void | Promise<void>): Presupposition<T> {
  return new Fact(description, validate, TimerFactory.newTimer())
}

export function situation<T>(descripion: string, presuppositions: Array<Presupposition<T>>): Presupposition<T> {
  return new Situation(descripion, presuppositions)
}

export function step<T>(description: string, validate: (context: T) => void | Promise<void>): Action<T> {
  return new Step(description, validate, TimerFactory.newTimer())
}

export function procedure<T>(descripion: string, steps: Array<Action<T>>): Action<T> {
  return new Procedure(descripion, steps)
}

export function effect<T>(description: string, validate: (context: T) => void | Promise<void>): Observation<T> {
  return new Effect(description, validate, TimerFactory.newTimer())
}

export function outcome<T>(description: string, effects: Array<Observation<T>>): Observation<T> {
  return new Outcome(description, effects)
}