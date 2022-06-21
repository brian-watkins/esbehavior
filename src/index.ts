import { Context, RunMode, ExampleBuilder, BehaviorExampleBuilder, ExampleSetupBuilder } from "./Example.js"
import { Reporter } from "./Reporter.js"
import { Behavior, BehaviorCollection } from "./Behavior.js"
import { Effect, Observation, Outcome } from "./Observation.js"
import { Condition, Step } from "./Assumption.js"
import { StandardReporter } from "./StandardReporter.js"
import { emptySummary, Summary } from "./Summary.js"
export { Observation, Effect, Outcome } from "./Observation.js"
export { Step, Condition } from "./Assumption.js"
export { Claim } from "./Claim.js"
export { Behavior } from "./Behavior.js"
export { Summary } from "./Summary.js"
export { Reporter, Writer, Failure } from "./Reporter.js"
export { StandardReporter } from "./StandardReporter.js"
export { TAPReporter } from "./TAPReporter.js"
export { Example, Context, ExampleBuilder, ExampleSetupBuilder, ExampleScriptBuilder, ExampleScriptsBuilder } from "./Example.js"
export { Script } from "./Script.js"

export interface ValidationOptions {
  reporter?: Reporter
}

export async function validate<T>(behaviors: Array<Behavior>, options: ValidationOptions = {}): Promise<Summary> {
  const reporter = options.reporter ?? new StandardReporter()

  reporter.start()

  const behaviorCollection = new BehaviorCollection(behaviors)

  try {
    const summary = await behaviorCollection.run(reporter)
    reporter.end(summary)
    return summary
  } catch (err: any) {
    reporter.terminate(err)
    return emptySummary()
  }
}

export function behavior<T>(description: string, examples: Array<ExampleBuilder<T>>): Behavior {
  return new Behavior(description, examples.map(builder => builder.build()))
}

const voidContext: Context<any> = { init: () => {} }

export function example<T = void>(context: Context<T> = voidContext): ExampleSetupBuilder<T> {
  return new BehaviorExampleBuilder(RunMode.Normal, context)
}

export const skip = {
  example<T = void>(context: Context<T> = voidContext): ExampleSetupBuilder<T> {
    return new BehaviorExampleBuilder(RunMode.Skipped, context)
  }
}

export const pick = {
  example<T = void>(context: Context<T> = voidContext): ExampleSetupBuilder<T> {
    return new BehaviorExampleBuilder(RunMode.Picked, context)
  }
}

export function condition<T>(description: string, validate: (context: T) => void | Promise<void>): Condition<T> {
  return new Condition(description, validate)
}

export function step<T>(description: string, validate: (context: T) => void | Promise<void>): Step<T> {
  return new Step(description, validate)
}

export function effect<T>(description: string, validate: (context: T) => void | Promise<void>): Observation<T> {
  return new Effect(description, validate)
}

export function outcome<T>(description: string, effects: Array<Observation<T>>): Observation<T> {
  return new Outcome(description, effects)
}