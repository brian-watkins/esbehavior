import { Reporter } from "./Reporter.js"
import { addExample, addSummary, emptySummary, Summary } from "./Summary.js"
import { waitFor } from "./waitFor.js"
import { Observation } from "./Observation.js"
import { Presupposition } from "./Presupposition.js"
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

interface ModeDelegate<T> {
  setMode(mode: Mode<T>): void
}

interface Mode<T> {
  handlePresupposition(run: ModeDelegate<T>, presupposition: Presupposition<T>): Promise<ClaimResult>
  handleAction(run: ModeDelegate<T>, action: Action<T>): Promise<ClaimResult>
  handleObservation(run: ModeDelegate<T>, observation: Observation<T>): Promise<ClaimResult>
}

class ExampleRun<T> implements ModeDelegate<T> {
  public summary = addExample(emptySummary())

  constructor(private mode: Mode<T>, private reporter: Reporter) {}

  setMode(mode: Mode<T>): void {
    this.mode = mode
  }

  async execute(scriptContexts: Array<ScriptContext<T>>): Promise<void> {
    for (let scriptContext of scriptContexts) {
      this.reporter.startScript(scriptContext.location)
      await this.runScript(scriptContext.script)
      this.reporter.endScript()

      if (this.summary.invalid > 0) {
        this.mode = new SkipMode()
      }
    }
  }

  private async runScript(script: Script<T>): Promise<void> {
    for (let presupposition of script.suppose ?? []) {
      const result = await this.mode.handlePresupposition(this, presupposition)
      this.reporter.recordPresupposition(result)
      this.updateSummary(result.summary)
    }

    for (let step of script.perform ?? []) {
      const result = await this.mode.handleAction(this, step)
      this.reporter.recordAction(result)
      this.updateSummary(result.summary)
    }

    for (let observation of script.observe ?? []) {
      const result = await this.mode.handleObservation(this, observation)
      this.reporter.recordObservation(result)
      this.updateSummary(result.summary)
    }
  }

  private updateSummary(summary: Summary) {
    this.summary = addSummary(this.summary)(summary)
  }
}


class ValidateMode<T> implements Mode<T> {
  constructor(private context: T) { }

  async handlePresupposition(delegate: ModeDelegate<T>, presupposition: Presupposition<T>): Promise<ClaimResult> {
    const result = await presupposition.validate(this.context)
    this.skipRemainingIfInvalid(delegate, result)
    return result
  }

  async handleAction(delegate: ModeDelegate<T>, action: Action<T>): Promise<ClaimResult> {
    const result = await action.validate(this.context)
    this.skipRemainingIfInvalid(delegate, result)
    return result
  }

  async handleObservation(delegate: ModeDelegate<T>, effect: Observation<T>): Promise<ClaimResult> {
    return await effect.validate(this.context)
  }

  skipRemainingIfInvalid(delegate: ModeDelegate<T>, result: ClaimResult) {
    result.when({
      valid: () => {
        // nothing
      },
      invalid: () => {
        delegate.setMode(new SkipMode())
      },
      skipped: () => {
        // nothing
      }
    })
  }
}

class SkipMode<T> implements Mode<T> {
  async handlePresupposition(delegate: ModeDelegate<T>, presupposition: Presupposition<T>): Promise<ClaimResult> {
    return presupposition.skip()
  }

  async handleAction(delegate: ModeDelegate<T>, action: Action<T>): Promise<ClaimResult> {
    return action.skip()
  }

  async handleObservation(delegate: ModeDelegate<T>, effect: Observation<T>): Promise<ClaimResult> {
    return effect.skip()
  }
}