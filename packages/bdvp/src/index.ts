import { Context, RunMode, ExampleBuilder, BDVPExampleBuilder, ExampleSetupBuilder } from "./Example.js"
import { ConsoleReporter, Reporter, startReport, writeSummary, terminateReport } from "./Reporter.js"
import { Behavior, BehaviorCollection } from "./Behavior.js"
import { Effect } from "./Effect.js"
import { Condition } from "./Condition.js"

export interface ValidationOptions {
  reporter?: Reporter
}

export async function validate<T>(behaviors: Array<Behavior>, options: ValidationOptions = {}): Promise<void> {
  const reporter = options.reporter || new ConsoleReporter()

  startReport(reporter)

  const behaviorCollection = new BehaviorCollection(behaviors)

  try {
    const results = await behaviorCollection.run(reporter)
    writeSummary(reporter, results)
  } catch (err) {
    terminateReport(reporter, err)
  }
}

export function behavior<T>(description: string, examples: Array<ExampleBuilder<T>>): Behavior {
  return new Behavior(description, examples.map(builder => builder.build()))
}

const voidContext: Context<any> = { subject: () => {} }

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