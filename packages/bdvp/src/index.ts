import { Observation } from "./Observation"
import { Context, Plan, Scenario, ScenarioKind, ScenarioPlan } from "./Scenario"
import { ConsoleReporter, Reporter, writeComment } from "./Reporter"
import { Document, DocumentCollection, ScenarioDocument } from "./Document"

export interface RunnerOptions {
  reporter?: Reporter
}

export async function runDocs<T>(docs: Array<Document>, options: RunnerOptions = {}): Promise<void> {
  const reporter = options.reporter || new ConsoleReporter()

  reporter.writeLine("TAP version 13")

  const docCollection = new DocumentCollection(docs)

  const results = await docCollection.run(reporter)

  reporter.writeLine(`1..${results.valid + results.invalid + results.skipped}`)
  writeComment(reporter, `valid observations: ${results.valid}`)
  writeComment(reporter, `invalid observations: ${results.invalid}`)
  writeComment(reporter, `skipped: ${results.skipped}`)
}

export function document(description: string, scenarios: Array<Scenario>): Document {
  return new ScenarioDocument(description, scenarios)
}

export function context<T>(generator: () => T | Promise<T>): Context<T> {
  return {
    generator
  }
}

const voidContext: Context<any> = context(() => {})

export function scenario<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
  return new ScenarioPlan(description, ScenarioKind.Normal, context)
}

export const skip = {
  scenario<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
    return new ScenarioPlan(description, ScenarioKind.Skipped, context)
  }
}

export const pick = {
  scenario<T = void>(description: string, context: Context<T> = voidContext): Plan<T> {
    return new ScenarioPlan(description, ScenarioKind.Picked, context)
  }
}

export function it<T>(description: string, observer: (context: T) => void | Promise<void>): Observation<T> {
  return {
    description,
    observer
  }
}