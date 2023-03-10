import { Behavior, ExampleOptions, ValidationMode } from "./Behavior.js"
import { Example, ExampleValidationOptions } from "./Example.js"
import { OrderProvider } from "./OrderProvider.js"
import { NullReporter, Reporter } from "./Reporter.js"
import { addBehavior, addSummary, emptySummary, Summary } from "./Summary.js"

export interface BehaviorValidationOptions {
  failFast: boolean,
  orderProvider: OrderProvider
}

class ExecutableExample {
  constructor(public mode: ValidationMode, private example: Example, private options: ExampleValidationOptions) {}

  validate(reporter: Reporter): Promise<Summary> {
    return this.example.validate(reporter, this.options)
  }
  skip(reporter: Reporter): Promise<Summary> {
    return this.example.skip(reporter, this.options)
  }
}

export class ValidatableBehavior {
  public hasPickedExamples: boolean = false
  public description: string
  public examples: Array<ExecutableExample> = []

  constructor(behavior: Behavior, options: BehaviorValidationOptions) {
    this.description = behavior.description
    for (const configurableExample of behavior.examples) {
      const exampleOptions = new ExampleOptions()
      const example = typeof configurableExample === "function" ? configurableExample(exampleOptions) : configurableExample
      if (exampleOptions.validationMode === ValidationMode.Picked) {
        this.hasPickedExamples = true
      }
      this.examples.push(new ExecutableExample(exampleOptions.validationMode, example, options))
    }
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
  validate(example: ExecutableExample): Promise<Summary>
}

class AllBehaviorsValidator implements BehaviorValidator {
  constructor (private reporter: Reporter) {}
  
  start(behavior: ValidatableBehavior): void {
    this.reporter.startBehavior(behavior.description)
  }

  end(behavior: ValidatableBehavior): void {
    this.reporter.endBehavior()
  }

  validate(example: ExecutableExample): Promise<Summary> {
    if (example.mode === ValidationMode.Skipped) {
      return example.skip(this.reporter)
    } else {
      return example.validate(this.reporter)
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

  validate(example: ExecutableExample): Promise<Summary> {
    if (example.mode === ValidationMode.Picked) {
      return example.validate(this.reporter)
    } else {
      return example.skip(this.nullReporter)
    }
  }
}

class SkipBehaviorsValidator implements BehaviorValidator {
  private nullReporter = new NullReporter()
  
  start(behavior: ValidatableBehavior): void {}

  end(behavior: ValidatableBehavior): void {}

  validate(example: ExecutableExample): Promise<Summary> {
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

  async validate(example: ExecutableExample): Promise<Summary> {
    if (this.hasFailed) {
      return this.skipValidator.validate(example)
    }

    const summary = await this.validator.validate(example)

    if (summary.invalid > 0) {
      this.hasFailed = true
    }

    return summary
  }
}