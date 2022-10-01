import { Behavior } from "./Behavior.js"
import { Example, RunMode } from "./Example.js"
import { NullReporter, Reporter } from "./Reporter.js"
import { addBehavior, addSummary, emptySummary, Summary } from "./Summary.js"

export interface BehaviorValidationOptions {
  failFast: boolean
}

export class ValidatableBehavior extends Behavior {
  public hasPickedExamples: boolean

  constructor(behavior: Behavior) {
    super(behavior.description, behavior.examples)
    this.hasPickedExamples = this.examples.find(example => example.runMode === RunMode.Picked) !== undefined
  }
}

export class Documentation {
  private someExampleIsPicked: boolean

  constructor(private behaviors: Array<ValidatableBehavior>) {
    this.someExampleIsPicked = this.behaviors.find(behavior => behavior.hasPickedExamples) !== undefined
  }

  async validate(reporter: Reporter, options: BehaviorValidationOptions): Promise<Summary> {
    return this.execute(this.getValidator(reporter, options))
  }

  private async execute(validator: BehaviorValidator): Promise<Summary> {
    let summary = emptySummary()

    for (const behavior of this.behaviors) {
      summary = addBehavior(summary)

      validator.start(behavior)
      for (const example of behavior.examples) {
        const behaviorSummary = await validator.validate(example)
        summary = addSummary(summary)(behaviorSummary)
      }
      validator.end(behavior)
    }

    return summary
  }

  private getValidator(reporter: Reporter, options: BehaviorValidationOptions): BehaviorValidator {
    let validator = this.someExampleIsPicked ?
      new PickedExamplesValidator(reporter, options) :
      new AllBehaviorsValidator(reporter, options)

    if (options.failFast) {
      return new FailFastBehaviorValidator(validator)
    }

    return validator
  }
}

interface BehaviorValidator {
  start(behavior: ValidatableBehavior): void
  end(behavior: ValidatableBehavior): void
  validate(behavior: Example): Promise<Summary>
}

class AllBehaviorsValidator implements BehaviorValidator {
  constructor (private reporter: Reporter, private options: BehaviorValidationOptions) {}
  
  start(behavior: ValidatableBehavior): void {
    this.reporter.startBehavior(behavior.description)
  }

  end(behavior: ValidatableBehavior): void {
    this.reporter.endBehavior()
  }

  async validate(example: Example): Promise<Summary> {
    if (example.runMode === RunMode.Skipped) {
      return await example.skip(this.reporter)
    } else {
      return await example.run(this.reporter)
    }
  }
}

class PickedExamplesValidator implements BehaviorValidator {
  private nullReporter = new NullReporter()

  constructor (private reporter: Reporter, private options: BehaviorValidationOptions) {}
  
  start(behavior: ValidatableBehavior): void {
    if (behavior.hasPickedExamples) {
      this.reporter.startBehavior(behavior.description)
    }
  }

  end(behavior: ValidatableBehavior): void {
    if (behavior.hasPickedExamples) {
      this.reporter.endBehavior()
    }
  }

  async validate(example: Example): Promise<Summary> {
    if (example.runMode === RunMode.Picked) {
      return await example.run(this.reporter)
    } else {
      return await example.skip(this.nullReporter)
    }
  }
}

class SkipBehaviorsValidator implements BehaviorValidator {
  private nullReporter = new NullReporter()
  
  start(behavior: ValidatableBehavior): void {}

  end(behavior: ValidatableBehavior): void {}

  async validate(example: Example): Promise<Summary> {
    return example.skip(this.nullReporter)
  }
}

class FailFastBehaviorValidator implements BehaviorValidator {
  private hasFailed = false
  private hasStartedBehavior = false
  private skipValidator = new SkipBehaviorsValidator()
  
  constructor (private validator: BehaviorValidator) {}

  start(behavior: ValidatableBehavior): void {
    if (this.hasFailed) {
      this.skipValidator.start(behavior)
      return
    }
    this.validator.start(behavior)
    this.hasStartedBehavior = true
  }

  end(behavior: ValidatableBehavior): void {
    if (!this.hasStartedBehavior && this.hasFailed) {
      this.skipValidator.start(behavior)
      return
    } 
      this.validator.end(behavior)
      this.hasStartedBehavior = false
  }

  async validate(example: Example): Promise<Summary> {
    if (this.hasFailed) {
      return await this.skipValidator.validate(example)
    }

    const summary = await this.validator.validate(example)

    if (summary.invalid > 0) {
      this.hasFailed = true
    }

    return summary
  }
}