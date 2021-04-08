import { Condition, ConditionResult, ConditionRunner } from "./Condition"
import { Observation, ObservationResult, ObservationRunner } from "./Observation"
import { Reporter, writeComment } from "./Reporter"
import { waitFor } from "./waitFor"

export interface Scenario {
  kind: ScenarioKind
  run(onlyIfPicked: boolean, reporter: Reporter): Promise<ScenarioResult>
}

export interface Context<T> {
  generator: () => T | Promise<T>
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

export class ScenarioPlan<T> implements Plan<T> {
  public conditions: Array<Condition<T>> = []
  public observations: Array<Observation<T>> = []

  constructor(public description: string, public kind: ScenarioKind, public context: Context<T>) { }

  when(description: string, run: (context: T) => void | Promise<void>): Plan<T> {
    this.conditions.push({ description, run })
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
    
    const conditionResult = await this.runConditions(scenarioMode, reporter)
    const observationResult = await this.runObservations(scenarioMode, reporter)

    return this.sumResults([conditionResult, observationResult])
  }

  private sumResults(results: Array<ScenarioResult>): ScenarioResult {
    return results.reduce((sum, next) => {
      return {
        valid: sum.valid + next.valid,
        invalid: sum.invalid + next.invalid,
        skipped: sum.skipped + next.skipped
      }
    }, { valid: 0, invalid: 0, skipped: 0 })
  }

  private async determineMode(verifyOnlyIfPicked: boolean): Promise<ScenarioMode<T>> {
    if (this.kind === ScenarioKind.Skipped || (verifyOnlyIfPicked && this.kind !== ScenarioKind.Picked)) {
      return { type: "Skip" }
    } else {
      return {
        type: "Verify",
        context: await waitFor(this.plan.context.generator())
      }
    }
  }

  async runConditions(scenarioMode: ScenarioMode<T>, reporter: Reporter): Promise<ScenarioResult> {
    const results = { valid: 0, invalid: 0, skipped: 0 }

    for (const condition of this.plan.conditions) {
      const runner = new ConditionRunner(condition, reporter)
      switch (scenarioMode.type) {
        case "Verify":
          const result = await runner.run(scenarioMode.context)
          switch (result) {
            case ConditionResult.Pass:
              results.valid += 1
              break
            case ConditionResult.Fail:
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
