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

export class DocumentCollection {
  constructor(private documents: Array<Document>) {}

  get onlyIfPicked(): boolean {
    return this.documents.find(doc => doc.hasBeenPicked) !== undefined
  }

  async run(reporter: Reporter): Promise<DocumentResult> {
    return gatherResults(this.onlyIfPicked, reporter, this.documents)
  }
}

export class ScenarioDocument implements Document {
  constructor(public description: string, public scenarios: Array<Scenario>) {}
  
  get hasBeenPicked(): boolean {
    return this.scenarios.find(scenario => scenario.kind === ScenarioKind.Picked) !== undefined 
  }

  async run(onlyIfPicked: boolean, reporter: Reporter): Promise<DocumentResult> {
    reporter.writeLine(`# ${this.description}`)
    return await gatherResults(onlyIfPicked, reporter, this.scenarios)
  }
}

interface RunnableDocs {
  run(onlyIfPicked: boolean, reporter: Reporter): Promise<DocumentResult>
}

async function gatherResults(onlyIfPicked: boolean, reporter: Reporter, runnables: Array<RunnableDocs>): Promise<DocumentResult> {
  const results = { valid: 0, invalid: 0, skipped: 0 }

  for (const runnable of runnables) {
    const result = await runnable.run(onlyIfPicked, reporter)
    results.valid += result.valid
    results.invalid += result.invalid
    results.skipped += result.skipped
  }

  return results
}