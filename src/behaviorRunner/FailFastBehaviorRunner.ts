import { BehaviorRunner } from "./index.js"
import { Behavior, ConfigurableBehavior, ConfigurableExample } from "../Behavior.js"
import { ExampleValidationOptions } from "../Example.js"
import { NullReporter } from "../reporter/index.js"
import { Summary } from "../Summary.js"
import { SkipBehaviorRunner } from "./SkipBehaviorRunner.js"

export class FailFastBehaviorRunner implements BehaviorRunner {
  private skipRunner = new SkipBehaviorRunner(new NullReporter())
  private hasInvalid = false

  constructor(private runner: BehaviorRunner) { }

  start(behavior: ConfigurableBehavior): Behavior {
    return this.runner.start(behavior)
  }

  end(behavior: Behavior) {
    this.runner.end(behavior)
  }

  async run(configurableExample: ConfigurableExample, options: ExampleValidationOptions): Promise<Summary> {
    if (this.hasInvalid) {
      return this.skipRunner.run(configurableExample, options)
    }

    const summary = await this.runner.run(configurableExample, options)

    if (summary.invalid > 0) {
      this.hasInvalid = true
    }

    return summary
  }
}