export interface Reporter {
  writeLine(message: string): void
}

class ConsoleReporter implements Reporter {
  writeLine(message: string) {
    console.log(message)
  }
}

export async function describe<T>(description: string, scenarios: Array<RunnableScenario<T>>, reporter: Reporter = new ConsoleReporter()): Promise<void> {
  reporter.writeLine("TAP version 13")
  reporter.writeLine(`# ${description}`)

  for (const scenario of scenarios) {
    await scenario.run(reporter)
  }
}

class ScenarioPlan<T> implements Plan<T> {
  private actions: Array<(context: T) => void | Promise<void>> = []

  constructor(private description: string, private context: T | Promise<T>) { }

  when(description: string, action: (context: T) => void | Promise<void>): Plan<T> {
    this.actions.push(action)
    return this
  }

  observeThat(observations: Observation<T>[]): RunnableScenario<T> {
    return {
      run: async (reporter) => {
        reporter.writeLine(`# ${this.description}`)
        
        let resolvedContext: T
        if (this.context instanceof Promise) {
          resolvedContext = await this.context
        } else {
          resolvedContext = this.context
        }

        for (const action of this.actions) {
          const result = action(resolvedContext)
          if (result instanceof Promise) {
            await result
          }
        }

        for (let i = 0; i < observations.length; i++) {
          const observation = observations[i]
          try {
            const result = observation.observer(resolvedContext)
            if (result instanceof Promise) {
              await result
            }
            reporter.writeLine(`ok ${i + 1} it ${observation.description}`)
          } catch (err) {
            reporter.writeLine(`not ok ${i + 1} it ${observation.description}`)
            reporter.writeLine('  ---')
            reporter.writeLine(`  operator: ${err.operator}`)
            reporter.writeLine(`  expected: ${err.expected}`)
            reporter.writeLine(`  actual:   ${err.actual}`)
            reporter.writeLine(`  stack: |-`)
            reporter.writeLine(`    ${err.stack}`)
            reporter.writeLine('  ...')
          }
        }
        reporter.writeLine(`1..${observations.length}`)
      }
    }
  }
}

export const scenario = <T>(description: string): Setup<T> => {
  return {
    given: (generator: () => T | Promise<T>) => {
      return new ScenarioPlan(description, generator())
    }
  }
}

export interface Setup<T> {
  given: (generator: () => T | Promise<T>) => Plan<T>
}

export interface RunnableScenario<T> {
  run(reporter: Reporter): Promise<void>
}

export interface Plan<T> {
  when: (description: string, actions: (context: T) => void | Promise<void>) => Plan<T>
  observeThat: (observations: Array<Observation<T>>) => RunnableScenario<T>
}

export interface Observation<T> {
  description: string
  observer: (context: T) => void | Promise<void>
}

export function it<T>(description: string, observer: (context: T) => void | Promise<void>): Observation<T> {
  return {
    description,
    observer
  }
}
