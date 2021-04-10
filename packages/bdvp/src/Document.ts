import { Scenario, ScenarioKind } from "./Scenario";
import { Reporter, writeComment } from "./Reporter";
import { addSummary, emptySummary, Summary } from "./Summary";

export class DocumentCollection {
  private someScenarioIsPicked: boolean

  constructor(private documents: Array<Document>) {
    this.someScenarioIsPicked = this.documents.find(doc => doc.hasPickedScenario) !== undefined
  }

  async run(reporter: Reporter): Promise<Summary> {
    let summary = emptySummary()

    for (const document of this.documents) {
      let documentSummary: Summary
      if (this.someScenarioIsPicked) {
        documentSummary = await document.runPicked(reporter)
      } else {
        documentSummary = await document.run(reporter)
      }

      summary = addSummary(summary, documentSummary)
    }

    return summary
  }
}

export class Document {
  public hasPickedScenario: boolean

  constructor(public description: string, public scenarios: Array<Scenario>) {
    this.hasPickedScenario = this.scenarios.find(scenario => scenario.kind === ScenarioKind.Picked) !== undefined
  }

  async runPicked(reporter: Reporter): Promise<Summary> {
    return this.execute((scenario) => scenario.kind === ScenarioKind.Picked, reporter)
  }

  async run(reporter: Reporter): Promise<Summary> {
    return this.execute((scenario) => scenario.kind !== ScenarioKind.Skipped, reporter)
  }

  private async execute(shouldRun: (scenario: Scenario) => boolean, reporter: Reporter): Promise<Summary> {
    writeComment(reporter, this.description)

    let summary = emptySummary()

    for (const scenario of this.scenarios) {
      let scenarioSummary: Summary
      if (shouldRun(scenario)) {
        scenarioSummary = await scenario.run(reporter)
      } else {
        scenarioSummary = await scenario.skip(reporter)
      }

      summary = addSummary(summary, scenarioSummary)
    }

    return summary
  }
}