import { Behavior, ConfigurableBehavior, ConfigurableExample, ValidationMode } from "../Behavior.js"
import { Example, ExampleValidationOptions } from "../Example.js"
import { OrderProvider } from "../OrderProvider.js"
import { Reporter } from "../reporter/index.js"
import { Summary } from "../Summary.js"

export interface BehaviorValidationOptions {
  reporter: Reporter
  orderProvider: OrderProvider
  failFast: boolean
  runPickedOnly: boolean
}

export interface BehaviorRunner {
  start(behavior: ConfigurableBehavior): Behavior
  end(behavior: Behavior): void
  run(configurableExample: ConfigurableExample, options: ExampleValidationOptions): Promise<Summary>
}

export interface ConfiguredBehavior {
  validationMode: ValidationMode
  behavior: Behavior
}

export interface ConfiguredExample {
  validationMode: ValidationMode
  example: Example
}
