import { Example, RunMode } from "./Example.js";
import { Reporter } from "./Reporter.js";
import { addSummary, emptySummary, Summary } from "./Summary.js";

export class BehaviorCollection {
  private someExampleIsPicked: boolean

  constructor(private behaviors: Array<Behavior>) {
    this.someExampleIsPicked = this.behaviors.find(behavior => behavior.hasPickedExamples) !== undefined
  }

  async run(reporter: Reporter): Promise<Summary> {
    let summary = emptySummary()

    for (const behavior of this.behaviors) {
      let behaviorSummary: Summary
      if (this.someExampleIsPicked) {
        behaviorSummary = await behavior.runPicked(reporter)
      } else {
        behaviorSummary = await behavior.run(reporter)
      }

      summary = addSummary(summary)(behaviorSummary)
    }

    return summary
  }
}

export class Behavior {
  public hasPickedExamples: boolean

  constructor(public description: string, public examples: Array<Example>) {
    this.hasPickedExamples = this.examples.find(example => example.runMode === RunMode.Picked) !== undefined
  }

  async runPicked(reporter: Reporter): Promise<Summary> {
    return this.execute((example) => example.runMode === RunMode.Picked, reporter)
  }

  async run(reporter: Reporter): Promise<Summary> {
    return this.execute((example) => example.runMode !== RunMode.Skipped, reporter)
  }

  private async execute(shouldRun: (example: Example) => boolean, reporter: Reporter): Promise<Summary> {
    reporter.startBehavior(this.description)

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