import { Observation } from "./Observation"
import { Context, Plan, Scenario, ScenarioKind } from "./Scenario"
import { ConsoleReporter, Reporter, startReport, writeSummary } from "./Reporter"
import { Document, DocumentCollection } from "./Document"

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

export function document(description: string, scenarios: Array<Scenario>): Document {
  return new Document(description, scenarios)
}

export function context<T>(generator: () => T | Promise<T>): Context<T> {
  return {
    generator
  }
}

const voidContext: Context<any> = context(() => {})

export function scenario<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
  return new Plan(description, ScenarioKind.Normal, context)
}

export const skip = {
  scenario<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
    return new Plan(description, ScenarioKind.Skipped, context)
  }
}

export const pick = {
  scenario<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
    return new Plan(description, ScenarioKind.Picked, context)
  }
}

export function it<T>(description: string, observer: (context: T) => void | Promise<void>): Observation<T> {
  return new Observation(description, observer)
}