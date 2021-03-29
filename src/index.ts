import { Observation } from "./Observation"
import { Plan, RunnablePlan, ScenarioPlan, SkippedScenarioPlan } from "./Plan"
import { ConsoleReporter, Reporter } from "./Reporter"

export interface Documentation {
  description: string
  scenarios: Array<RunnablePlan>
}

export interface DocumentationOptions {
  reporter?: Reporter
}

export async function runDocs(docs: Array<Documentation>, options: DocumentationOptions = {}): Promise<void> {
  const reporter = options.reporter || new ConsoleReporter()

  reporter.writeLine("TAP version 13")

  let observationCount = 0
  for (const documentation of docs) {
    reporter.writeLine(`# ${documentation.description}`)
    for (const scenario of documentation.scenarios) {
      const result = await scenario.run(reporter)
      observationCount += result.observations
    }
  }

  reporter.writeLine(`1..${observationCount}`)
}

export function document<T>(description: string, scenarios: Array<RunnablePlan>): Documentation {
  return { description, scenarios }
}

export interface Setup<T> {
  given: (generator: () => T | Promise<T>) => Plan<T>
}

export const skip = {
  scenario<T>(description: string): Setup<T> {
    return {
      given: (generator: () => T | Promise<T>) => {
        return new SkippedScenarioPlan(description, generator)
      }
    }
  }
}

export const scenario = <T>(description: string): Setup<T> => {
  return {
    given: (generator: () => T | Promise<T>) => {
      return new ScenarioPlan(description, generator)
    }
  }
}

export function it<T>(description: string, observer: (context: T) => void | Promise<void>): Observation<T> {
  return {
    description,
    observer
  }
}
