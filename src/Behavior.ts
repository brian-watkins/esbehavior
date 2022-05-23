import { Example, RunMode } from "./Example.js";
import { NullReporter, Reporter } from "./Reporter.js";
import { addBehavior, addSummary, emptySummary, Summary } from "./Summary.js";

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
    return this.execute(new RunPickedIgnoreOthers(reporter))
  }

  async run(reporter: Reporter): Promise<Summary> {
    return this.execute(new RunButSkipIndicated(reporter))
  }

  private async execute(runner: BehaviorRunner): Promise<Summary> {
    runner.start(this)

    let summary = addBehavior(emptySummary())

    for (const example of this.examples) {
      const exampleSummary = await runner.run(example)
      summary = addSummary(summary)(exampleSummary)
    }

    runner.end(this)

    return summary
  }
}

interface BehaviorRunner {
  start(behavior: Behavior): void
  end(behavior: Behavior): void
  run(example: Example): Promise<Summary>
}

class RunPickedIgnoreOthers implements BehaviorRunner {
  private nullReporter = new NullReporter()

  constructor (public reporter: Reporter) {}

  start(behavior: Behavior): void {
    if (behavior.hasPickedExamples) {
      this.reporter.startBehavior(behavior.description)
    }
  }

  end(behavior: Behavior): void {
    if (behavior.hasPickedExamples) {
      this.reporter.endBehavior()
    }
  }

  async run(example: Example): Promise<Summary> {
    if (example.runMode === RunMode.Picked) {
      return await example.run(this.reporter)
    } else {
      return await example.skip(this.nullReporter)
    }
  }
}

class RunButSkipIndicated implements BehaviorRunner {
  constructor (public reporter: Reporter) {}

  start(behavior: Behavior): void {
    this.reporter.startBehavior(behavior.description)
  }

  end(behavior: Behavior): void {
    this.reporter.endBehavior()
  }

  async run(example: Example): Promise<Summary> {
    if (example.runMode === RunMode.Skipped) {
      return await example.skip(this.reporter)
    } else {
      return await example.run(this.reporter)
    }
  }
}
