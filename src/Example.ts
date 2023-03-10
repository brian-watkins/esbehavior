import { NullReporter, Reporter } from "./Reporter.js"
import { addExample, addSummary, emptySummary, Summary } from "./Summary.js"
import { waitFor } from "./waitFor.js"
import { Observation } from "./Observation.js"
import { Presupposition } from "./Presupposition.js"
import { Script, ScriptContext, scriptContext } from "./Script.js"
import { ClaimResult, summarize } from "./Claim.js"
import { Action } from "./Action.js"
import { OrderProvider } from "./OrderProvider.js"

export interface ExampleValidationOptions {
  orderProvider: OrderProvider,
  failFast: boolean,
}

export interface Example {
  validate(reporter: Reporter, options: ExampleValidationOptions): Promise<Summary>
  skip(reporter: Reporter, options: ExampleValidationOptions): Promise<Summary>
}

export interface Context<T> {
  init: () => T | Promise<T>
  teardown?: (context: T) => void | Promise<void>
}

export interface ExampleSetup<T> extends Example {
  description(description: string): ExampleScript<T>
  script(script: Script<T>): ExampleScripts<T>
}

export interface ExampleScript<T> extends Example {
  script(script: Script<T>): ExampleScripts<T>
}

export interface ExampleScripts<T> extends Example {
  andThen(script: Script<T>): ExampleScripts<T>
}

export class BehaviorExampleBuilder<T> implements Example, ExampleSetup<T>, ExampleScript<T>, ExampleScripts<T> {
  private exampleDescription: string | undefined
  private scripts: Array<ScriptContext<T>> = []

  constructor(private context: Context<T>) {}

  description(description: string): ExampleScript<T> {
    this.exampleDescription = description
    return this
  }

  script(script: Script<T>): ExampleScripts<T> {
    this.scripts = [scriptContext(script)]
    return this
  }

  andThen(script: Script<T>): ExampleScripts<T> {
    this.scripts.push(scriptContext(script))
    return this
  }

  async validate(reporter: Reporter, options: ExampleValidationOptions): Promise<Summary> {
    reporter.startExample(this.exampleDescription)

    const context = await waitFor(this.context.init())

    const mode: Mode<T> = options.failFast ?
      new FailFastMode(new ValidateMode(reporter, context)) :
      new ValidateMode(reporter, context)

    const run = new ExampleRun<T>(mode, reporter, options)

    const summary = await run.execute(this.scripts)

    await waitFor(this.context.teardown?.(context))

    reporter.endExample()

    return summary
  }

  async skip(reporter: Reporter, options: ExampleValidationOptions): Promise<Summary> {
    reporter.startExample(this.exampleDescription)

    const run = new ExampleRun<T>(new SkipMode(reporter), reporter, options)

    const summary = await run.execute(this.scripts)

    reporter.endExample()

    return summary
  }
}

interface ModeDelegate<T> {
  setMode(mode: Mode<T>): void
}

interface Mode<T> {
  handlePresupposition(delegate: ModeDelegate<T>, presupposition: Presupposition<T>): Promise<ClaimResult>
  handleAction(delegate: ModeDelegate<T>, action: Action<T>): Promise<ClaimResult>
  handleObservation(delegate: ModeDelegate<T>, observation: Observation<T>): Promise<ClaimResult>
}

class ExampleRun<T> implements ModeDelegate<T> {
  constructor(private mode: Mode<T>, private reporter: Reporter, private options: ExampleValidationOptions) {}

  setMode(mode: Mode<T>): void {
    this.mode = mode
  }

  async execute(scriptContexts: Array<ScriptContext<T>>): Promise<Summary> {
    let summary = addExample(emptySummary())

    for (let scriptContext of scriptContexts) {
      this.reporter.startScript(scriptContext.location)
      const scriptSummary = await this.runScript(scriptContext.script)
      this.reporter.endScript()

      if (scriptSummary.invalid > 0) {
        this.mode = new SkipMode(this.reporter)
      }

      summary = addSummary(summary)(scriptSummary)
    }

    return summary
  }

  private async runScript(script: Script<T>): Promise<Summary> {
    let summary = emptySummary()

    for (let presupposition of script.suppose ?? []) {
      const result = await this.mode.handlePresupposition(this, presupposition)
      summary = addSummary(summary)(summarize(result))
    }

    for (let step of script.perform ?? []) {
      const result = await this.mode.handleAction(this, step)
      summary = addSummary(summary)(summarize(result))
    }

    for (let observation of this.options.orderProvider.order(script.observe ?? [])) {
      const result = await this.mode.handleObservation(this, observation)
      summary = addSummary(summary)(summarize(result))
    }

    return summary
  }
}


class ValidateMode<T> implements Mode<T> {
  constructor(private reporter: Reporter, private context: T) { }

  async handlePresupposition(delegate: ModeDelegate<T>, presupposition: Presupposition<T>): Promise<ClaimResult> {
    const result = await presupposition.validate(this.context)
    this.reporter.recordPresupposition(result)
    this.skipRemainingIfInvalid(delegate, result)
    return result
  }

  async handleAction(delegate: ModeDelegate<T>, action: Action<T>): Promise<ClaimResult> {
    const result = await action.validate(this.context)
    this.reporter.recordAction(result)
    this.skipRemainingIfInvalid(delegate, result)
    return result
  }

  async handleObservation(delegate: ModeDelegate<T>, effect: Observation<T>): Promise<ClaimResult> {
    const result = await effect.validate(this.context)
    this.reporter.recordObservation(result)
    return result
  }

  skipRemainingIfInvalid(delegate: ModeDelegate<T>, result: ClaimResult) {
    if (result.type === "invalid-claim") {
      delegate.setMode(new SkipMode(this.reporter))
    }
  }
}

class SkipMode<T> implements Mode<T> {
  constructor(private reporter: Reporter) {}

  async handlePresupposition(delegate: ModeDelegate<T>, presupposition: Presupposition<T>): Promise<ClaimResult> {
    const result = presupposition.skip()
    this.reporter.recordPresupposition(result)
    return result
  }

  async handleAction(delegate: ModeDelegate<T>, action: Action<T>): Promise<ClaimResult> {
    const result = action.skip()
    this.reporter.recordAction(result)
    return result
  }

  async handleObservation(delegate: ModeDelegate<T>, effect: Observation<T>): Promise<ClaimResult> {
    const result = effect.skip()
    this.reporter.recordObservation(result)
    return result
  }
}

class FailFastMode<T> implements Mode<T> {
  constructor(private mode: Mode<T>) {}
  
  async handlePresupposition(delegate: ModeDelegate<T>, presupposition: Presupposition<T>): Promise<ClaimResult> {
    const result = await this.mode.handlePresupposition(delegate, presupposition)
    this.skipRemainingIfInvalid(delegate, result)

    return result
  }

  async handleAction(delegate: ModeDelegate<T>, action: Action<T>): Promise<ClaimResult> {
    const result = await this.mode.handleAction(delegate, action)
    this.skipRemainingIfInvalid(delegate, result)

    return result
  }
  
  async handleObservation(delegate: ModeDelegate<T>, observation: Observation<T>): Promise<ClaimResult> {
    const result = await this.mode.handleObservation(delegate, observation)
    this.skipRemainingIfInvalid(delegate, result)

    return result
  }

  skipRemainingIfInvalid(delegate: ModeDelegate<T>, result: ClaimResult) {
    if (result.type === "invalid-claim") {
      delegate.setMode(new SkipMode(new NullReporter()))
    }
  }
}