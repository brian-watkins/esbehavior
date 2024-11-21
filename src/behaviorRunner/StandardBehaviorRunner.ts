import { Behavior, BehaviorOptions, ConfigurableBehavior, ConfigurableExample, ExampleOptions, ValidationMode } from "../Behavior.js"
import { ExampleValidationOptions } from "../Example.js"
import { Reporter } from "../reporter/index.js"
import { Summary } from "../Summary.js"
import { BehaviorRunner, ConfiguredBehavior, ConfiguredExample } from "./index.js"



export class StandardBehaviorRunner implements BehaviorRunner {
  protected behaviorMode: ValidationMode | undefined

  constructor(protected reporter: Reporter) { }

  start(configurableBehavior: ConfigurableBehavior): Behavior {
    const configuredBehavior = this.configureBehavior(configurableBehavior)
    this.reporter.startBehavior(configuredBehavior.behavior.description)
    return configuredBehavior.behavior
  }

  end(_: Behavior) {
    this.reporter.endBehavior()
  }

  protected configureBehavior(configurableBehavior: ConfigurableBehavior): ConfiguredBehavior {
    const behaviorOptions = new BehaviorOptions()
    const behavior = typeof configurableBehavior === "function" ?
      configurableBehavior(behaviorOptions) :
      configurableBehavior

    this.behaviorMode = behaviorOptions.validationMode

    return {
      validationMode: behaviorOptions.validationMode,
      behavior
    }
  }

  protected configureExample(configurableExample: ConfigurableExample): ConfiguredExample {
    const exampleOptions = new ExampleOptions()
    const example = typeof configurableExample === "function" ?
      configurableExample(exampleOptions) :
      configurableExample

    return {
      validationMode: this.behaviorMode === ValidationMode.Skipped ?
        ValidationMode.Skipped :
        exampleOptions.validationMode,
      example
    }
  }

  run(configurableExample: ConfigurableExample, options: ExampleValidationOptions): Promise<Summary> {
    const configuredExample = this.configureExample(configurableExample)

    if (configuredExample.validationMode === ValidationMode.Skipped) {
      return configuredExample.example.skip(this.reporter, options)
    } else {
      return configuredExample.example.validate(this.reporter, options)
    }
  }
}
