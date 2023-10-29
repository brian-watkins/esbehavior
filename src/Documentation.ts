import { BehaviorOptions, ConfigurableBehavior, ExampleOptions, ValidationMode } from "./Behavior.js"
import { BehaviorValidationOptions, DocumentationRunner } from "./DocumentationRunner.js"
import { Summary } from "./Summary.js"

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
  constructor(private behaviors: Array<ConfigurableBehavior>, private options: BehaviorValidationOptions) { }

  async validate(): Promise<Summary> {
    const runner = new DocumentationRunner(this.options)

    runner.start()

    for (const behavior of this.options.orderProvider.order(this.behaviors)) {
      await runner.run(behavior, this.options)
    }

    runner.end()

    return runner.getSummary()
  }
}
