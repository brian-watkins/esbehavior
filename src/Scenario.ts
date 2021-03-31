import { Observation, ObservationResult, ObservationRunner } from "./Observation"
import { Reporter, writeComment } from "./Reporter"
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
  valid: number
  invalid: number
  skipped: number
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
  public observations: Array<Observation<T>> = []

  constructor(public description: string, public kind: ScenarioKind, public initializer: () => T | Promise<T>) { }

  when(description: string, run: (context: T) => void | Promise<void>): Plan<T> {
    this.actions.push({ description, run })
    return this
  }

  observeThat(observations: Observation<T>[]): Scenario {
    this.observations = observations
    return new RunnableScenario(this)
  }
}

interface SkipScenarioMode {
  type: "Skip"
}

interface VerifyScenarioMode<T> {
  type: "Verify"
  context: T
}

type ScenarioMode<T>
  = SkipScenarioMode
  | VerifyScenarioMode<T>


class RunnableScenario<T> implements Scenario {
  constructor(private plan: ScenarioPlan<T>) {}

  get kind(): ScenarioKind {
    return this.plan.kind
  }

  async run(verifyOnlyIfPicked: boolean, reporter: Reporter): Promise<ScenarioResult> {
    writeComment(reporter, this.plan.description)

    const scenarioMode = await this.determineMode(verifyOnlyIfPicked)
    
    await this.runActions(scenarioMode, reporter)
    return this.runObservations(scenarioMode, reporter)
  }

  private async determineMode(verifyOnlyIfPicked: boolean): Promise<ScenarioMode<T>> {
    if (this.kind === ScenarioKind.Skipped || (verifyOnlyIfPicked && this.kind !== ScenarioKind.Picked)) {
      return { type: "Skip" }
    } else {
      return {
        type: "Verify",
        context: await waitFor(this.plan.initializer())
      }
    }
  }

  async runActions(scenarioMode: ScenarioMode<T>, reporter: Reporter): Promise<void> {
    for (const action of this.plan.actions) {
      if (scenarioMode.type === "Verify") {
          await waitFor(action.run(scenarioMode.context))
      }
      writeAction(reporter, action.description)
    }
  }

  async runObservations(scenarioMode: ScenarioMode<T>, reporter: Reporter): Promise<ScenarioResult> {
    const results = { valid: 0, invalid: 0, skipped: 0 }

    for (const observation of this.plan.observations) {
      const runner = new ObservationRunner(observation, reporter)
      switch (scenarioMode.type) {
        case "Verify":
          const result = await runner.run(scenarioMode.context)
          switch (result) {
            case ObservationResult.Valid:
              results.valid += 1
              break
            case ObservationResult.Invalid:
              results.invalid += 1
              break
          }
          break
        case "Skip":
          runner.reportSkipped()
          results.skipped += 1
          break
      }
    }

    return results
  }
}

function writeAction(reporter: Reporter, action: string) {
  writeComment(reporter, `when ${action}`)
}