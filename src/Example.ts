import { NullReporter, Reporter } from "./Reporter.js"
import { addExample, addSummary, emptySummary, Summary } from "./Summary.js"
import { waitFor } from "./waitFor.js"
import { Observation } from "./Observation.js"
import { Presupposition } from "./Presupposition.js"
import { Script, ScriptContext, scriptContext } from "./Script.js"
import { ClaimResult } from "./Claim.js"
import { Action } from "./Action.js"
import { OrderProvider } from "./OrderProvider.js"

export interface ExampleValidationOptions {
  orderProvider: OrderProvider,
  failFast: boolean
}

export interface Example {
  runMode: RunMode
  run(reporter: Reporter): Promise<Summary>
  skip(reporter: Reporter): Promise<Summary>
}

export interface Context<T> {
  init: () => T | Promise<T>
  teardown?: (context: T) => void | Promise<void>
}

export enum RunMode {
  Normal, Skipped, Picked
}

export interface ExampleBuilder<T> {
  build(options: ExampleValidationOptions): Example
}

export interface ExampleSetupBuilder<T> extends ExampleBuilder<T> {
  description(description: string): ExampleScriptBuilder<T>
  script(script: Script<T>): ExampleScriptsBuilder<T>
}

export interface ExampleScriptBuilder<T> extends ExampleBuilder<T> {
  script(script: Script<T>): ExampleScriptsBuilder<T>
}

export interface ExampleScriptsBuilder<T> extends ExampleBuilder<T> {
  andThen(script: Script<T>): ExampleScriptsBuilder<T>
}

export class BehaviorExampleBuilder<T> implements ExampleBuilder<T>, ExampleSetupBuilder<T>, ExampleScriptBuilder<T>, ExampleScriptsBuilder<T> {
  private exampleDescription: string | undefined
  private scripts: Array<ScriptContext<T>> = []

  constructor(private runMode: RunMode, private context: Context<T>) {}

  description(description: string): ExampleScriptBuilder<T> {
    this.exampleDescription = description
    return this
  }

  script(script: Script<T>): ExampleScriptsBuilder<T> {
    this.scripts = [scriptContext(script)]
    return this
  }

  andThen(script: Script<T>): ExampleScriptsBuilder<T> {
    this.scripts.push(scriptContext(script))
    return this
  }

  build(options: ExampleValidationOptions): Example {
    return new BehaviorExample(this.exampleDescription, this.scripts, this.runMode, this.context, options)
  }
}

export class BehaviorExample<T> implements Example {
  constructor(private description: string | undefined, private scripts: Array<ScriptContext<T>>, public runMode: RunMode, public context: Context<T>, private options: ExampleValidationOptions) { }

  async run(reporter: Reporter): Promise<Summary> {
    reporter.startExample(this.description)

    const context = await waitFor(this.context.init())

    const mode: Mode<T> = this.options.failFast ?
      new FailFastMode(new ValidateMode(reporter, context)) :
      new ValidateMode(reporter, context)

    const run = new ExampleRun<T>(mode, reporter, this.options)

    const summary = await run.execute(this.scripts)

    await waitFor(this.context.teardown?.(context))

    reporter.endExample()

    return summary
  }

  async skip(reporter: Reporter): Promise<Summary> {
    reporter.startExample(this.description)

    const run = new ExampleRun<T>(new SkipMode(reporter), reporter, this.options)

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
      summary = addSummary(summary)(result.summary)
    }

    for (let step of script.perform ?? []) {
      const result = await this.mode.handleAction(this, step)
      summary = addSummary(summary)(result.summary)
    }

    for (let observation of this.options.orderProvider.order(script.observe ?? [])) {
      const result = await this.mode.handleObservation(this, observation)
      summary = addSummary(summary)(result.summary)
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
    result.when({
      valid: () => {},
      invalid: () => {
        delegate.setMode(new SkipMode(this.reporter))
      },
      skipped: () => {}
    })
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
  
  handlePresupposition(run: ModeDelegate<T>, presupposition: Presupposition<T>): Promise<ClaimResult> {
    return this.mode.handlePresupposition(run, presupposition)
  }

  handleAction(delegate: ModeDelegate<T>, action: Action<T>): Promise<ClaimResult> {
    return this.mode.handleAction(delegate, action)
  }
  
  async handleObservation(delegate: ModeDelegate<T>, observation: Observation<T>): Promise<ClaimResult> {
    const result = await this.mode.handleObservation(delegate, observation)

    result.when({
      valid: () => {},
      invalid: () => {
        delegate.setMode(new SkipMode(new NullReporter()))
      },
      skipped: () => {}
    })

    return result
  }
}