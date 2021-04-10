import { Scenario, ScenarioKind, ScenarioResult } from "./Scenario";
import { DocumentResult, Reporter, writeComment } from "./Reporter";

export interface Document {
  description: string
  scenarios: Array<Scenario>
  hasPickedScenario: boolean
  run: (onlyIfPicked: boolean, reporter: Reporter) => Promise<DocumentResult>
}

export class DocumentCollection {
  constructor(private documents: Array<Document>) {}

  get hasPickeScenario(): boolean {
    return this.documents.find(doc => doc.hasPickedScenario) !== undefined
  }

  async run(reporter: Reporter): Promise<DocumentResult> {
    return gatherDocumentResults(this.hasPickeScenario, reporter, this.documents)
  }
}

export class ScenarioDocument implements Document {
  constructor(public description: string, public scenarios: Array<Scenario>) {}
  
  get hasPickedScenario(): boolean {
    return this.scenarios.find(scenario => scenario.kind === ScenarioKind.Picked) !== undefined 
  }

  async run(onlyIfPicked: boolean, reporter: Reporter): Promise<DocumentResult> {
    writeComment(reporter, this.description)
    return await gatherScenarioResults(onlyIfPicked, reporter, this.scenarios)
  }
}

async function gatherDocumentResults(hasPickedScenario: boolean, reporter: Reporter, documents: Array<Document>): Promise<DocumentResult> {
  const results = { valid: 0, invalid: 0, skipped: 0 }

  for (const document of documents) {
    const result = await document.run(hasPickedScenario, reporter)
    results.valid += result.valid
    results.invalid += result.invalid
    results.skipped += result.skipped
  }

  return results
}

async function gatherScenarioResults(hasPickedScenario: boolean, reporter: Reporter, scenarios: Array<Scenario>): Promise<DocumentResult> {
  const results = { valid: 0, invalid: 0, skipped: 0 }

  for (const scenario of scenarios) {
    let result: ScenarioResult
    if (hasPickedScenario && scenario.kind !== ScenarioKind.Picked) {
      result = await scenario.skip(reporter)
    } else if (scenario.kind === ScenarioKind.Skipped) {
      result = await scenario.skip(reporter)
    } else {
      result = await scenario.run(reporter)
    }

    results.valid += result.valid
    results.invalid += result.invalid
    results.skipped += result.skipped
  }

  return results
}