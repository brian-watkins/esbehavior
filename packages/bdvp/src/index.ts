import { Context, RunMode, ExampleBuilder } from "./Example"
import { ConsoleReporter, Reporter, startReport, writeSummary, terminateReport } from "./Reporter"
import { Document, DocumentCollection } from "./Document"
import { Effect } from "./Effect"
import { Condition } from "./Condition"

export interface ValidationOptions {
  reporter?: Reporter
}

export async function validate<T>(docs: Array<Document>, options: ValidationOptions = {}): Promise<void> {
  const reporter = options.reporter || new ConsoleReporter()

  startReport(reporter)

  const docCollection = new DocumentCollection(docs)

  try {
    const results = await docCollection.run(reporter)
    writeSummary(reporter, results)
  } catch (err) {
    terminateReport(reporter, err)
  }
}

export function document<T>(description: string, examples: Array<ExampleBuilder<T>>): Document {
  return new Document(description, examples.map(builder => builder.build()))
}

const voidContext: Context<any> = { subject: () => {} }

export function example<T = void>(context: Context<T> = voidContext): ExampleBuilder<T> {
  return new ExampleBuilder(RunMode.Normal, context)
}

export const skip = {
  example<T = void>(context: Context<T> = voidContext): ExampleBuilder<T> {
    return new ExampleBuilder(RunMode.Skipped, context)
  }
}

export const pick = {
  example<T = void>(context: Context<T> = voidContext): ExampleBuilder<T> {
    return new ExampleBuilder(RunMode.Picked, context)
  }
}

export function condition<T>(description: string, validate: (context: T) => void | Promise<void>): Condition<T> {
  return new Condition(description, validate)
}

export function effect<T>(description: string, validate: (context: T) => void | Promise<void>): Effect<T> {
  return new Effect(description, validate)
}