import { Context, RunMode, ExampleBuilder, BDVPExampleBuilder, ExampleSetupBuilder } from "./Example.js"
import { ConsoleWriter, Writer } from "./Reporter.js"
import { Behavior, BehaviorCollection } from "./Behavior.js"
import { Effect } from "./Effect.js"
import { Condition } from "./Condition.js"
import { TAPReporter } from "./TAPReporter.js"

export interface ValidationOptions {
  writer?: Writer
}

export async function validate<T>(behaviors: Array<Behavior>, options: ValidationOptions = {}): Promise<void> {
  const writer = options.writer || new ConsoleWriter()
  const reporter = new TAPReporter(writer)

  reporter.start()

  const behaviorCollection = new BehaviorCollection(behaviors)

  try {
    const results = await behaviorCollection.run(reporter)
    reporter.end(results)
  } catch (err) {
    reporter.terminate(err)
  }
}

export function behavior<T>(description: string, examples: Array<ExampleBuilder<T>>): Behavior {
  return new Behavior(description, examples.map(builder => builder.build()))
}

const voidContext: Context<any> = { init: () => {} }

export function example<T = void>(context: Context<T> = voidContext): ExampleSetupBuilder<T> {
  return new BDVPExampleBuilder(RunMode.Normal, context)
}

export const skip = {
  example<T = void>(context: Context<T> = voidContext): ExampleSetupBuilder<T> {
    return new BDVPExampleBuilder(RunMode.Skipped, context)
  }
}

export const pick = {
  example<T = void>(context: Context<T> = voidContext): ExampleSetupBuilder<T> {
    return new BDVPExampleBuilder(RunMode.Picked, context)
  }
}

export function condition<T>(description: string, validate: (context: T) => void | Promise<void>): Condition<T> {
  return new Condition(description, validate)
}

export function effect<T>(description: string, validate: (context: T) => void | Promise<void>): Effect<T> {
  return new Effect(description, validate)
}