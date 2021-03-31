import { Observation } from "./Observation"
import { Plan, Scenario, ScenarioKind, ScenarioPlan } from "./Scenario"
import { ConsoleReporter, Reporter } from "./Reporter"
import { Document, DocumentDetails } from "./Document"

export interface RunnerOptions {
  reporter?: Reporter
}

export async function runDocs<T>(docs: Array<Document>, options: RunnerOptions = {}): Promise<void> {
  const reporter = options.reporter || new ConsoleReporter()

  reporter.writeLine("TAP version 13")

  const onlyIfPicked = docs.find(doc => doc.hasBeenPicked) !== undefined

  let results = { valid: 0, invalid: 0, skipped: 0 }

  for (const document of docs) {
    const result = await document.run(onlyIfPicked, reporter)
    results.valid += result.valid
    results.invalid += result.invalid
    results.skipped += result.skipped
  }

  reporter.writeLine(`1..${results.valid + results.invalid + results.skipped}`)
  reporter.writeLine(`# valid observations: ${results.valid}`)
  reporter.writeLine(`# invalid observations: ${results.invalid}`)
  reporter.writeLine(`# skipped: ${results.skipped}`)
}

export function document(description: string, scenarios: Array<Scenario>): Document {
  return new DocumentDetails(description, scenarios)
}

export interface Setup<T> {
  given: (generator: () => T | Promise<T>) => Plan<T>
}

export const skip = {
  scenario<T>(description: string): Setup<T> {
    return {
      given: (generator: () => T | Promise<T>): Plan<T> => {
        return new ScenarioPlan(description, ScenarioKind.Skipped, generator)
      }
    }
  }
}

export const pick = {
  scenario<T>(description: string): Setup<T> {
    return {
      given: (generator: () => T | Promise<T>): Plan<T> => {
        return new ScenarioPlan(description, ScenarioKind.Picked, generator)
      }
    }
  }
}

export const scenario = <T>(description: string): Setup<T> => {
  return {
    given: (generator: () => T | Promise<T>) => {
      return new ScenarioPlan(description, ScenarioKind.Normal, generator)
    }
  }
}

export function it<T>(description: string, observer: (context: T) => void | Promise<void>): Observation<T> {
  return {
    description,
    observer
  }
}