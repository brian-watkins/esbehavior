import { Behavior } from "./Behavior.js"
import { Example, RunMode } from "./Example.js"
import { OrderProvider } from "./OrderProvider.js"
import { NullReporter, Reporter } from "./Reporter.js"
import { addBehavior, addSummary, emptySummary, Summary } from "./Summary.js"

export interface BehaviorValidationOptions {
  failFast: boolean,
  orderProvider: OrderProvider
}

export class ValidatableBehavior {
  public hasPickedExamples: boolean
  public description: string
  public examples: Array<Example>

  constructor(behavior: Behavior, options: BehaviorValidationOptions) {
    this.description = behavior.description
    this.examples = behavior.examples.map(ex => ex.build(options))
    this.hasPickedExamples = this.examples.find(example => example.runMode === RunMode.Picked) !== undefined
  }
}

export class Documentation {
  private someExampleIsPicked: boolean

  constructor(private behaviors: Array<ValidatableBehavior>, private options: BehaviorValidationOptions) {
    this.someExampleIsPicked = this.behaviors.find(behavior => behavior.hasPickedExamples) !== undefined
  }

  async validate(reporter: Reporter): Promise<Summary> {
    return this.execute(this.getValidator(reporter))
  }

  private async execute(validator: BehaviorValidator): Promise<Summary> {
    let summary = emptySummary()

    for (const behavior of this.options.orderProvider.order(this.behaviors)) {
      summary = addBehavior(summary)

      validator.start(behavior)
      for (const example of this.options.orderProvider.order(behavior.examples)) {
        const behaviorSummary = await validator.validate(example)
        summary = addSummary(summary)(behaviorSummary)
      }
      validator.end(behavior)
    }

    return summary
  }

  private getValidator(reporter: Reporter): BehaviorValidator {
    let validator = this.someExampleIsPicked ?
      new PickedExamplesValidator(reporter) :
      new AllBehaviorsValidator(reporter)

    if (this.options.failFast) {
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
  constructor (private reporter: Reporter) {}
  
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

  constructor (private reporter: Reporter) {}
  
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