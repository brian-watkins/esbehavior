import { Observation, ObservationRunner } from "./Observation"
import { Reporter } from "./Reporter"
import { waitFor } from "./waitFor"

export interface Scenario {
  kind: ScenarioKind
  run(onlyIfPicked: boolean, reporter: Reporter): Promise<ScenarioResult>
}

export interface Plan<T> {
  when: (description: string, actions: (context: T) => void | Promise<void>) => Plan<T>
  observeThat: (observations: Array<Observation<T>>) => Scenario
}

export interface ScenarioResult {
  observations: number
}

export enum ScenarioKind {
  Normal, Skipped, Picked
}

interface ScenarioAction<T> {
  description: string
  run(context: T): void | Promise<void>
}

export class ScenarioPlan<T> implements Plan<T> {
  public actions: Array<ScenarioAction<T>> = []

  constructor(private description: string, private kind: ScenarioKind, private initializer: () => T | Promise<T>) { }

  when(description: string, run: (context: T) => void | Promise<void>): Plan<T> {
    this.actions.push({ description, run })
    return this
  }

  observeThat(observations: Observation<T>[]): Scenario {
    return {
      kind: this.kind,
      run: async (onlyIfPicked, reporter) => {
        if (this.kind === ScenarioKind.Skipped || (onlyIfPicked && this.kind !== ScenarioKind.Picked)) {
          return this.skip(observations, reporter)
        } else {
          return this.run(observations, reporter)
        }
      }
    }
  }

  private async run(observations: Array<Observation<T>>, reporter: Reporter): Promise<ScenarioResult> {
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

  private skip(observations: Array<Observation<T>>, reporter: Reporter): ScenarioResult {
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