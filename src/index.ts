import { Observation } from "./Observation"
import { Plan, RunnablePlan, ScenarioPlan } from "./Plan"
import { ConsoleReporter, Reporter } from "./Reporter"

export async function describe<T>(description: string, scenarios: Array<RunnablePlan<T>>, reporter: Reporter = new ConsoleReporter()): Promise<void> {
  reporter.writeLine("TAP version 13")
  reporter.writeLine(`# ${description}`)

  for (const scenario of scenarios) {
    await scenario.run(reporter)
  }
}

export interface Setup<T> {
  given: (generator: () => T | Promise<T>) => Plan<T>
}

export const scenario = <T>(description: string): Setup<T> => {
  return {
    given: (generator: () => T | Promise<T>) => {
      return new ScenarioPlan(description, generator())
    }
  }
}

export function it<T>(description: string, observer: (context: T) => void | Promise<void>): Observation<T> {
  return {
    description,
    observer
  }
}
