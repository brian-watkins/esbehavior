import { Context, Plan, Example, RunMode, BDVPExample } from "./Example"
import { ConsoleReporter, Reporter, startReport, writeSummary } from "./Reporter"
import { Document, DocumentCollection } from "./Document"
import { Effect } from "./Effect"
import { Condition } from "./Condition"

export interface RunnerOptions {
  reporter?: Reporter
}

export async function runDocs<T>(docs: Array<Document>, options: RunnerOptions = {}): Promise<void> {
  const reporter = options.reporter || new ConsoleReporter()

  startReport(reporter)

  const docCollection = new DocumentCollection(docs)
  const results = await docCollection.run(reporter)

  writeSummary(reporter, results)
}

export function document(description: string, examples: Array<Example>): Document {
  return new Document(description, examples)
}

export function context<T>(generator: () => T | Promise<T>, teardown?: (context: T) => void | Promise<void>): Context<T> {
  return {
    generator,
    teardown
  }
}

const voidContext: Context<any> = context(() => {})

export function example<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
  return new BDVPExample(description, RunMode.Normal, context)
}

export const skip = {
  example<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
    return new BDVPExample(description, RunMode.Skipped, context)
  }
}

export const pick = {
  example<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
    return new BDVPExample(description, RunMode.Picked, context)
  }
}

export function condition<T>(description: string, validate: (context: T) => void | Promise<void>): Condition<T> {
  return new Condition(description, validate)
}

export function effect<T>(description: string, validate: (context: T) => void | Promise<void>): Effect<T> {
  return new Effect(description, validate)
}