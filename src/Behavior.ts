import { Example, RunMode } from "./Example.js";
import { NullReporter, Reporter } from "./Reporter.js";
import { addBehavior, addSummary, emptySummary, Summary } from "./Summary.js";

export interface BehaviorRunOptions {
  failFast: boolean
}

export class Behavior {
  public hasPickedExamples: boolean

  constructor(public description: string, public examples: Array<Example>) {
    this.hasPickedExamples = this.examples.find(example => example.runMode === RunMode.Picked) !== undefined
  }

  async runPicked(reporter: Reporter, options: BehaviorRunOptions): Promise<Summary> {
    return this.executeWithOptions(new RunPickedIgnoreOthers(reporter), options)
  }

  async run(reporter: Reporter, options: BehaviorRunOptions): Promise<Summary> {
    return this.executeWithOptions(new RunButSkipIndicated(reporter), options)
  }

  async skip(reporter: Reporter): Promise<Summary> {
    return this.execute(new SkipAll(reporter))
  }

  private async executeWithOptions(runner: BehaviorRunner, options: BehaviorRunOptions): Promise<Summary> {
    if (options.failFast) {
      return this.execute(new FailFastRunner(runner))
    } else {
      return this.execute(runner)
    }
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

class SkipAll implements BehaviorRunner {
  constructor (public reporter: Reporter) {}

  start(behavior: Behavior): void {
    this.reporter.startBehavior(behavior.description)
  }

  end(behavior: Behavior): void {
    this.reporter.endBehavior()
  }

  async run(example: Example): Promise<Summary> {
    return await example.skip(this.reporter)
  }
}

class FailFastRunner implements BehaviorRunner {
  private hasFailed: boolean = false

  constructor (private runner: BehaviorRunner) {}

  start(behavior: Behavior): void {
    this.runner.start(behavior)
  }

  end(behavior: Behavior): void {
    this.runner.end(behavior)
  }

  async run(example: Example): Promise<Summary> {
    if (this.hasFailed) {
      return await example.skip(new NullReporter())
    }

    const summary = await this.runner.run(example)
    if (summary.invalid > 0) {
      this.hasFailed = true
    }

    return summary
  }
}
