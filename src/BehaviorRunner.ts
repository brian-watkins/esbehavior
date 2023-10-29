import { Behavior, BehaviorOptions, ConfigurableBehavior, ConfigurableExample, ExampleOptions, ValidationMode } from "./Behavior.js"
import { Example, ExampleValidationOptions } from "./Example.js"
import { NullReporter, Reporter } from "./Reporter.js"
import { Summary } from "./Summary.js"

export interface BehaviorRunner {
  start(behavior: ConfigurableBehavior): Behavior
  end(behavior: Behavior): void
  run(configurableExample: ConfigurableExample, options: ExampleValidationOptions): Promise<Summary>
}

interface ConfiguredExample {
  validationMode: ValidationMode
  example: Example
}

interface ConfiguredBehavior {
  validationMode: ValidationMode
  behavior: Behavior
}

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

export class SkipBehaviorRunner extends StandardBehaviorRunner {
  constructor(reporter: Reporter) {
    super(reporter)
  }

  run(configurableExample: ConfigurableExample, options: ExampleValidationOptions): Promise<Summary> {
    const configuredExample = this.configureExample(configurableExample)
    return configuredExample.example.skip(this.reporter, options)
  }
}
