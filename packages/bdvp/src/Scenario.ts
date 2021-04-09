import { Condition } from "./Condition"
import { Observation } from "./Observation"
import { Reporter, writeComment, writeTestFailure, writeTestPass, writeTestSkip } from "./Reporter"
import { ScenarioStep, StepRunner } from "./ScenarioStep"
import { waitFor } from "./waitFor"

export interface Scenario {
  kind: ScenarioKind
  run(onlyIfPicked: boolean, reporter: Reporter): Promise<ScenarioResult>
}

export interface Context<T> {
  generator: () => T | Promise<T>
}

export interface Plan<T> {
  when: (description: string, condition: (context: T) => void | Promise<void>) => Plan<T>
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
    this.conditions.push(new Condition(description, run))
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
    
    const conditionResults = await this.runSteps(this.plan.conditions, scenarioMode, reporter)
    const observationResults = await this.runSteps(this.plan.observations, scenarioMode, reporter)

    return this.sumResults([conditionResults, observationResults])
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

  async runSteps(steps: Array<ScenarioStep<T>>, scenarioMode: ScenarioMode<T>, reporter: Reporter): Promise<ScenarioResult> {
    const results = { valid: 0, invalid: 0, skipped: 0 }

    for (const step of steps) {
      const runner = new StepRunner(step, reporter)
      switch (scenarioMode.type) {
        case "Verify":
          const result = await runner.run(scenarioMode.context)
          switch (result.type) {
            case "Valid":
              writeTestPass(reporter, step.description)
              results.valid += 1
              break
            case "Invalid":
              writeTestFailure(reporter, step.description, result.error)
              results.invalid += 1
              break
          }
          break
        case "Skip":
          writeTestSkip(reporter, step.description)
          results.skipped += 1
          break
      }
    }

    return results
  }
}