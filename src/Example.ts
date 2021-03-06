import { Reporter } from "./Reporter.js"
import { addExample, addSummary, emptySummary, Summary } from "./Summary.js"
import { waitFor } from "./waitFor.js"
import { Observation } from "./Observation.js"
import { Fact, Presupposition } from "./Presupposition.js"
import { Script, ScriptContext, scriptContext } from "./Script.js"
import { ClaimResult } from "./Claim.js"
import { Action } from "./Action.js"

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
  build(): Example
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
  private example: BehaviorExample<T>

  constructor(public runMode: RunMode, context: Context<T>) {
    this.example = new BehaviorExample(runMode, context)
  }

  description(description: string): ExampleScriptBuilder<T> {
    this.example.setDescription(description)
    return this
  }

  script(script: Script<T>): ExampleScriptsBuilder<T> {
    this.example.setScript(scriptContext(script))
    return this
  }

  andThen(script: Script<T>): ExampleScriptsBuilder<T> {
    this.example.addScript(scriptContext(script))
    return this
  }

  build(): Example {
    return this.example
  }
}

export class BehaviorExample<T> implements Example {
  private description?: string
  private scripts: Array<ScriptContext<T>> = []

  constructor(public runMode: RunMode, public context: Context<T>) { }

  setDescription(description: string) {
    this.description = description
  }

  setScript(script: ScriptContext<T>) {
    this.scripts = [script]
  }

  addScript(script: ScriptContext<T>) {
    this.scripts.push(script)
  }

  async run(reporter: Reporter): Promise<Summary> {
    reporter.startExample(this.description)

    const context = await waitFor(this.context.init())

    const run = new ExampleRun<T>(new ValidateMode(context), reporter)

    await run.execute(this.scripts)

    await waitFor(this.context.teardown?.(context))

    reporter.endExample()

    return run.summary
  }

  async skip(reporter: Reporter): Promise<Summary> {
    reporter.startExample(this.description)

    const run = new ExampleRun<T>(new SkipMode(), reporter)

    await run.execute(this.scripts)

    reporter.endExample()

    return run.summary
  }
}

interface Mode<T> {
  handlePresupposition(run: ExampleRun<T>, scriptContext: ScriptContext<T>, presupposition: Presupposition<T>): Promise<void>
  handleAction(run: ExampleRun<T>, scriptContext: ScriptContext<T>, action: Action<T>): Promise<void>
  handleObservation(run: ExampleRun<T>, scriptContext: ScriptContext<T>, observation: Observation<T>): Promise<void>
}

class ExampleRun<T> {
  public summary = addExample(emptySummary())

  constructor(
    public mode: Mode<T>,
    public reporter: Reporter,
  ) { }

  async execute(scriptContexts: Array<ScriptContext<T>>): Promise<void> {
    for (let scriptContext of scriptContexts) {
      await this.runScript(scriptContext)

      if (this.summary.invalid > 0) {
        this.mode = new SkipMode()
      }
    }
  }

  private async runScript(context: ScriptContext<T>): Promise<void> {
    for (let presupposition of context.script.suppose ?? []) {
      await this.mode.handlePresupposition(this, context, presupposition)
    }

    for (let step of context.script.perform ?? []) {
      await this.mode.handleAction(this, context, step)
    }

    for (let observation of context.script.observe ?? []) {
      await this.mode.handleObservation(this, context, observation)
    }
  }

  recordPresupposition(result: ClaimResult) {
    this.reporter.recordPresupposition(result)
    this.updateSummary(result.summary)
  }

  recordAction(result: ClaimResult) {
    this.reporter.recordAction(result)
    this.updateSummary(result.summary)
  }

  recordObservation(result: ClaimResult) {
    this.reporter.recordObservation(result)
    this.updateSummary(result.summary)
  }

  private updateSummary(summary: Summary) {
    this.summary = addSummary(this.summary)(summary)
  }
}


class ValidateMode<T> implements Mode<T> {
  constructor(private context: T) { }

  async handlePresupposition(run: ExampleRun<T>, scriptContext: ScriptContext<T>, presupposition: Presupposition<T>): Promise<void> {
    const result = await presupposition.validate(scriptContext, this.context)
    run.recordPresupposition(result)
    this.skipRemainingIfInvalid(run, result)
  }

  async handleAction(run: ExampleRun<T>, scriptContext: ScriptContext<T>, action: Action<T>): Promise<void> {
    const result = await action.validate(scriptContext, this.context)
    run.recordAction(result)
    this.skipRemainingIfInvalid(run, result)
  }

  async skipRemainingIfInvalid(run: ExampleRun<T>, result: ClaimResult): Promise<void> {
    result.when({
      valid: () => {
        // nothing
      },
      invalid: () => {
        run.mode = new SkipMode()
      },
      skipped: () => {
        // nothing
      }
    })
  }

  async handleObservation(run: ExampleRun<T>, scriptContext: ScriptContext<T>, effect: Observation<T>): Promise<void> {
    const observationResult = await effect.validate(scriptContext, this.context)
    run.recordObservation(observationResult)
  }
}

class SkipMode<T> implements Mode<T> {
  async handlePresupposition(run: ExampleRun<T>, scriptContext: ScriptContext<T>, presupposition: Presupposition<T>): Promise<void> {
    run.recordPresupposition(presupposition.skip(scriptContext))
  }

  async handleAction(run: ExampleRun<T>, scriptContext: ScriptContext<T>, action: Action<T>): Promise<void> {
    run.recordAction(action.skip(scriptContext))
  }

  async handleObservation(run: ExampleRun<T>, scriptContext: ScriptContext<T>, effect: Observation<T>): Promise<void> {
    const skippedResult = effect.skip(scriptContext)
    run.recordObservation(skippedResult)
  }
}