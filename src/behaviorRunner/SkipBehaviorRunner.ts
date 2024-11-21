import { ConfigurableExample } from "../Behavior.js"
import { ExampleValidationOptions } from "../Example.js"
import { Reporter } from "../reporter/index.js"
import { Summary } from "../Summary.js"
import { StandardBehaviorRunner } from "./StandardBehaviorRunner.js"

export class SkipBehaviorRunner extends StandardBehaviorRunner {
  constructor(reporter: Reporter) {
    super(reporter)
  }

  run(configurableExample: ConfigurableExample, options: ExampleValidationOptions): Promise<Summary> {
    const configuredExample = this.configureExample(configurableExample)
    return configuredExample.example.skip(this.reporter, options)
  }
}
