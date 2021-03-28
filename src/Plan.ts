import { Observation, ObservationRunner } from "./Observation"
import { Reporter } from "./Reporter"
import { waitFor } from "./waitFor"

export interface Plan<T> {
  when: (description: string, actions: (context: T) => void | Promise<void>) => Plan<T>
  observeThat: (observations: Array<Observation<T>>) => RunnablePlan<T>
}

export interface RunnablePlan<T> {
  run(reporter: Reporter): Promise<void>
}

export class ScenarioPlan<T> implements Plan<T> {
  private actions: Array<(context: T) => void | Promise<void>> = []

  constructor(private description: string, private context: T | Promise<T>) { }

  when(description: string, action: (context: T) => void | Promise<void>): Plan<T> {
    this.actions.push(action)
    return this
  }

  observeThat(observations: Observation<T>[]): RunnablePlan<T> {
    return {
      run: async (reporter) => {
        reporter.writeLine(`# ${this.description}`)
        
        const resolvedContext = await waitFor(this.context)

        for (const action of this.actions) {
          await waitFor(action(resolvedContext))
        }

        for (let i = 0; i < observations.length; i++) {
          const runner = new ObservationRunner(i + 1, observations[i], reporter)
          await runner.run(resolvedContext)
        }
        reporter.writeLine(`1..${observations.length}`)
      }
    }
  }
}