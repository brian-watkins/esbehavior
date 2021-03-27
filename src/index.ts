export interface Reporter {
  writeLine(message: string): void
}

class ConsoleReporter implements Reporter {
  writeLine(message: string) {
    console.log(message)
  }
}

export function describe<T>(description: string, scenarios: Array<RunnableScenario<T>>, reporter: Reporter = new ConsoleReporter()) {
  reporter.writeLine("TAP version 13")
  reporter.writeLine(`# ${description}`)
  scenarios.forEach(scenario => {
    scenario.run(reporter)
  })
}

class ScenarioPlan<T> implements Plan<T> {
  constructor(private description: string, private context: T) { }

  when(description: string, actions: (context: T) => void): Plan<T> {
    return this
  }

  observeThat(observations: Observation<T>[]): RunnableScenario<T> {
    return {
      run: (reporter) => {
        reporter.writeLine(`# ${this.description}`)
        observations.forEach((observation, index) => {
          try {
            observation.observer(this.context)
            reporter.writeLine(`ok ${index + 1} it ${observation.description}`)
          } catch (err) {
            reporter.writeLine(`not ok ${index + 1} it ${observation.description}`)
            reporter.writeLine(' ---')
            reporter.writeLine(` ${err.stack}`)
            reporter.writeLine(' ...')
          }
        })
        reporter.writeLine(`1..${observations.length}`)
      }
    }
  }
}

export const scenario = <T>(description: string): Setup<T> => {
  return {
    given: (generator: () => T) => {
      return new ScenarioPlan(description, generator())
    }
  }
}

export interface Setup<T> {
  given: (generator: () => T) => Plan<T>
}

export interface RunnableScenario<T> {
  run(reporter: Reporter): void
}

export interface Plan<T> {
  when: (description: string, actions: (context: T) => void) => Plan<T>
  observeThat: (observations: Array<Observation<T>>) => RunnableScenario<T>
}

export interface Observation<T> {
  description: string
  observer: (context: T) => void
}

export function it<T>(description: string, observer: (context: T) => void): Observation<T> {
  return {
    description,
    observer
  }
}
