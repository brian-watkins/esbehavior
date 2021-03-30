import { Observation } from "./Observation"
import { Plan, Scenario, ScenarioKind, ScenarioPlan } from "./Plan"
import { ConsoleReporter, Reporter } from "./Reporter"
import { Document, DocumentDetails } from "./Document"

export interface RunnerOptions {
  reporter?: Reporter
}

export async function runDocs<T>(docs: Array<Document>, options: RunnerOptions = {}): Promise<void> {
  const reporter = options.reporter || new ConsoleReporter()

  reporter.writeLine("TAP version 13")

  const onlyIfPicked = docs.find(doc => doc.hasBeenPicked) !== undefined

  let observationCount = 0
  for (const document of docs) {
    const result = await document.run(onlyIfPicked, reporter)
    observationCount += result.observations
  }

  reporter.writeLine(`1..${observationCount}`)
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