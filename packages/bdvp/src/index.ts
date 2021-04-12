import { Context, Plan, Example, RunMode } from "./Scenario"
import { ConsoleReporter, Reporter, startReport, writeSummary } from "./Reporter"
import { Document, DocumentCollection } from "./Document"
import { Fact } from "./Fact"

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

export function context<T>(generator: () => T | Promise<T>): Context<T> {
  return {
    generator
  }
}

const voidContext: Context<any> = context(() => {})

export function example<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
  return new Plan(description, RunMode.Normal, context)
}

export const skip = {
  example<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
    return new Plan(description, RunMode.Skipped, context)
  }
}

export const pick = {
  example<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
    return new Plan(description, RunMode.Picked, context)
  }
}

export function fact<T>(description: string, run: (context: T) => void | Promise<void>): Fact<T> {
  return new Fact(description, run)
}