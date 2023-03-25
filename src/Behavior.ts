import { Example } from "./Example.js"

export enum ValidationMode {
  Normal, Skipped, Picked
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

export class Behavior {
  constructor(public description: string, public examples: Array<((mode: ExampleOptions) => Example) | Example>) {}
}