import { Behavior, BehaviorRunOptions } from "./Behavior.js"
import { NullReporter, Reporter } from "./Reporter.js"
import { addSummary, emptySummary, Summary } from "./Summary.js"

export interface DocumentationValidationOptions {
  failFast: boolean
}

export class Documentation {
  private someExampleIsPicked: boolean

  constructor(private behaviors: Array<Behavior>) {
    this.someExampleIsPicked = this.behaviors.find(behavior => behavior.hasPickedExamples) !== undefined
  }

  async validate(reporter: Reporter, options: DocumentationValidationOptions): Promise<Summary> {
    return this.execute(this.getValidator(reporter, options))
  }

  private async execute(validator: DocumentationValidator): Promise<Summary> {
    let summary = emptySummary()

    for (const behavior of this.behaviors) {
      const behaviorSummary = await validator.validate(behavior)
      summary = addSummary(summary)(behaviorSummary)
    }

    return summary
  }

  private getValidator(reporter: Reporter, options: DocumentationValidationOptions): DocumentationValidator {
    let validator = this.someExampleIsPicked ?
      new PickedExamplesValidator(reporter, options) :
      new AllBehaviorsValidator(reporter, options)

    if (options.failFast) {
      return new FailFastDocumentationValidator(validator)
    }

    return validator
  }
}

interface DocumentationValidator {
  validate(behavior: Behavior): Promise<Summary>
}

class AllBehaviorsValidator implements DocumentationValidator {
  constructor (private reporter: Reporter, private options: BehaviorRunOptions) {}
  
  async validate(behavior: Behavior): Promise<Summary> {
    return await behavior.run(this.reporter, this.options)
  }
}

class PickedExamplesValidator implements DocumentationValidator {
  constructor (private reporter: Reporter, private options: BehaviorRunOptions) {}
  
  async validate(behavior: Behavior): Promise<Summary> {
    return await behavior.runPicked(this.reporter, this.options)
  }
}

class FailFastDocumentationValidator implements DocumentationValidator {
  private hasFailed = false
  
  constructor (private validator: DocumentationValidator) {}

  async validate(behavior: Behavior): Promise<Summary> {
    if (this.hasFailed) {
      return await behavior.skip(new NullReporter())
    }

    const summary = await this.validator.validate(behavior)

    if (summary.invalid > 0) {
      this.hasFailed = true
    }

    return summary
  }
}