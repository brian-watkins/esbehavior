import { Observation, ObservationRunner } from "./Observation"
import { Reporter } from "./Reporter"
import { waitFor } from "./waitFor"

export interface Plan<T> {
  when: (description: string, actions: (context: T) => void | Promise<void>) => Plan<T>
  observeThat: (observations: Array<Observation<T>>) => RunnablePlan
}

export interface PlanResult {
  observations: number
}

export interface RunnablePlan {
  run(reporter: Reporter): Promise<PlanResult>
}

interface ScenarioAction<T> {
  description: string
  run(context: T): void | Promise<void>
}

export class ScenarioPlan<T> implements Plan<T> {
  protected actions: Array<ScenarioAction<T>> = []

  constructor(protected description: string, protected initializer: () => T | Promise<T>) { }

  when(description: string, run: (context: T) => void | Promise<void>): Plan<T> {
    this.actions.push({ description, run })
    return this
  }

  observeThat(observations: Observation<T>[]): RunnablePlan {
    return {
      run: async (reporter) => {
        reporter.writeLine(`# ${this.description}`)

        const resolvedContext = await waitFor(this.initializer())

        for (const action of this.actions) {
          await waitFor(action.run(resolvedContext))
          reporter.writeLine(`# when ${action.description}`)
        }

        for (const observation of observations) {
          const runner = new ObservationRunner(observation, reporter)
          await runner.run(resolvedContext)
        }

        return { observations: observations.length }
      }
    }
  }
}

export class SkippedScenarioPlan<T> extends ScenarioPlan<T> {
  observeThat(observations: Array<Observation<T>>): RunnablePlan {
    return {
      run: async (reporter) => {
        reporter.writeLine(`# ${this.description}`)

        for (const action of this.actions) {
          reporter.writeLine(`# when ${action.description}`)
        }

        for (const observation of observations) {
          const runner = new ObservationRunner(observation, reporter)
          runner.reportSkipped()
        }

        return {
          observations: observations.length
        }
      }
    }
  }
}