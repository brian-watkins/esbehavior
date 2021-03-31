import { Scenario, ScenarioKind } from "./Scenario";
import { Reporter } from "./Reporter";

export interface Document {
  description: string
  scenarios: Array<Scenario>
  hasBeenPicked: boolean
  run: (onlyIfPicked: boolean, reporter: Reporter) => Promise<DocumentResult>
}

export interface DocumentResult {
  valid: number
  invalid: number
  skipped: number
}

export class DocumentDetails implements Document {
  constructor(public description: string, public scenarios: Array<Scenario>) {}
  
  get hasBeenPicked(): boolean {
    return this.scenarios.find(scenario => scenario.kind === ScenarioKind.Picked) !== undefined 
  }

  async run(onlyIfPicked: boolean, reporter: Reporter): Promise<DocumentResult> {
    let totalObservations = 0

    reporter.writeLine(`# ${this.description}`)

    const results = { valid: 0, invalid: 0, skipped: 0 }

    for (const scenario of this.scenarios) {
      const result = await scenario.run(onlyIfPicked, reporter)
      results.valid += result.valid
      results.invalid += result.invalid
      results.skipped += result.skipped
    }

    return results
  }
}