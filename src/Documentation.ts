import { BehaviorOptions, ConfigurableBehavior, ExampleOptions, ValidationMode } from "./Behavior.js"
import { BehaviorValidationOptions } from "./behaviorRunner/index.js"
import { runBehavior, ValidationStatus } from "./behaviorRunner/run.js"
import { addSummary, emptySummary, Summary } from "./Summary.js"

export function hasPickedExamples(configurableBehaviors: Array<ConfigurableBehavior>): boolean {
  for (const configurableBehavior of configurableBehaviors) {
    const behaviorOptions = new BehaviorOptions()
    const behavior = typeof configurableBehavior === "function" ?
      configurableBehavior(behaviorOptions) :
      configurableBehavior
    if (behaviorOptions.validationMode === ValidationMode.Picked) {
      return true
    } else if (behaviorOptions.validationMode === ValidationMode.Skipped) {
      continue
    }

    for (const configurableExample of behavior.examples) {
      const exampleOptions = new ExampleOptions()
      const example = typeof configurableExample === "function" ?
        configurableExample(exampleOptions) :
        configurableExample
      if (exampleOptions.validationMode === ValidationMode.Picked) {
        return true
      }
    }
  }

  return false
}

export class Documentation {
  private validationStatus: ValidationStatus = ValidationStatus.VALID

  constructor(private behaviors: Array<ConfigurableBehavior>, private options: BehaviorValidationOptions) { }

  async validate(): Promise<Summary> {
    this.options.reporter.start(this.options.orderProvider.description)

    let summary = emptySummary()
    for (const behavior of this.options.orderProvider.order(this.behaviors)) {
      const behaviorSummary = await runBehavior(this.options, this.validationStatus, behavior)
      summary = addSummary(summary, behaviorSummary)

      if (summary.invalid > 0) {
        this.validationStatus = ValidationStatus.INVALID
      }
    }

    this.options.reporter.end(summary)

    return summary
  }
}
