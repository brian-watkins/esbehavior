import { Example, RunMode } from "./Example.js";
import { Reporter, writeComment } from "./Reporter.js";
import { addSummary, emptySummary, Summary } from "./Summary.js";

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

      summary = addSummary(summary)(documentSummary)
    }

    return summary
  }
}

export class Document {
  public hasPickedScenario: boolean

  constructor(public description: string, public examples: Array<Example>) {
    this.hasPickedScenario = this.examples.find(example => example.runMode === RunMode.Picked) !== undefined
  }

  async runPicked(reporter: Reporter): Promise<Summary> {
    return this.execute((example) => example.runMode === RunMode.Picked, reporter)
  }

  async run(reporter: Reporter): Promise<Summary> {
    return this.execute((example) => example.runMode !== RunMode.Skipped, reporter)
  }

  private async execute(shouldRun: (example: Example) => boolean, reporter: Reporter): Promise<Summary> {
    writeComment(reporter, this.description)

    let summary = emptySummary()

    for (const example of this.examples) {
      let exampleSummary: Summary
      if (shouldRun(example)) {
        exampleSummary = await example.run(reporter)
      } else {
        exampleSummary = await example.skip(reporter)
      }

      summary = addSummary(summary)(exampleSummary)
    }

    return summary
  }
}