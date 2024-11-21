import { ConfiguredExample } from "./index.js"
import { Behavior, ConfigurableBehavior, ConfigurableExample, ValidationMode } from "../Behavior.js"
import { ExampleValidationOptions } from "../Example.js"
import { NullReporter } from "../reporter/index.js"
import { Summary } from "../Summary.js"
import { StandardBehaviorRunner } from "./StandardBehaviorRunner.js"

export class PickedOnlyBehaviorRunner extends StandardBehaviorRunner {
  private behavior: Behavior | undefined
  private hasSeenPicked = false

  start(configurableBehavior: ConfigurableBehavior): Behavior {
    this.behavior = this.configureBehavior(configurableBehavior).behavior
    if (this.behaviorMode === ValidationMode.Picked) {
      this.reporter.startBehavior(this.behavior.description)
      this.hasSeenPicked = true
    }
    
    return this.behavior
  }

  end(_: Behavior): void {
    if (this.hasSeenPicked) {
      this.reporter.endBehavior()
    }
  }

  protected configureExample(configurableExample: ConfigurableExample): ConfiguredExample {
    const configuredExample = super.configureExample(configurableExample)
    if (this.behaviorMode === ValidationMode.Picked && configuredExample.validationMode !== ValidationMode.Skipped) {
      configuredExample.validationMode = ValidationMode.Picked
    }
    return configuredExample
  }

  run(configurableExample: ConfigurableExample, options: ExampleValidationOptions): Promise<Summary> {
    const configuredExample = this.configureExample(configurableExample)
    
    if (configuredExample.validationMode === ValidationMode.Picked) {
      if (!this.hasSeenPicked) {
        this.reporter.startBehavior(this.behavior!.description)
        this.hasSeenPicked = true
      }
      return configuredExample.example.validate(this.reporter, options)
    } else {
      return configuredExample.example.skip(new NullReporter(), options)
    }
  }
}