import { Context } from "./Context.js"
import { Example } from "./Example.js"

export enum ValidationMode {
  Normal, Skipped, Picked
}

export type ConfigurableBehavior = ((mode: BehaviorOptions) => Behavior) | Behavior

export type ConfigurableExample = ((model: ExampleOptions) => Example) | Example

export class BehaviorOptions {
  public validationMode: ValidationMode = ValidationMode.Normal

  pick(): true {
    this.validationMode = ValidationMode.Picked
    return true
  }

  skip(): true {
    this.validationMode = ValidationMode.Skipped
    return true
  }
}

export class ExampleOptions {
  public validationMode: ValidationMode = ValidationMode.Normal

  pick(): true {
    this.validationMode = ValidationMode.Picked
    return true
  }

  skip(): true {
    this.validationMode = ValidationMode.Skipped
    return true
  }
}

export interface Behavior {
  description: string
  examples: Array<ConfigurableExample>
}