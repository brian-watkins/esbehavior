import { Reporter } from "./Reporter.js"
import { addExample, addInvalid, addSkipped, addValid, emptySummary, Summary } from "./Summary.js"
import { waitFor } from "./waitFor.js"
import { Effect } from "./Effect.js"
import { Assumption, Condition, Step } from "./Assumption.js"
import * as stackTraceParser from 'stacktrace-parser';

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

export interface Script<T> {
  prepare?: Array<Condition<T>>
  perform?: Array<Step<T>>
  observe?: Array<Effect<T>>
}

export interface ScriptContext<T> {
  location: string
  script: Script<T>
}

function scriptContext<T>(script: Script<T>): ScriptContext<T> {
  return {
    location: scriptLocation(),
    script
  }
}

function scriptLocation(): string {
  try {
    const error = new Error()
    const frame = stackTraceParser.parse(error.stack!)[3]
    return `${frame.file}:${frame.lineNumber}:${frame.column}`
  } catch (err) {
    return "Unknown script location"
  }
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
  handleAssumption(run: ExampleRun<T>, scriptContext: ScriptContext<T>, assumption: Assumption<T>): Promise<void>
  handleObservation(run: ExampleRun<T>, scriptContext: ScriptContext<T>, effect: Effect<T>): Promise<void>
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
    for (let condition of context.script.prepare ?? []) {
      await this.mode.handleAssumption(this, context, condition)
    }

    for (let step of context.script.perform ?? []) {
      await this.mode.handleAssumption(this, context, step)
    }

    for (let effect of context.script.observe ?? []) {
      await this.mode.handleObservation(this, context, effect)
    }
  }

  updateSummary(summarizer: (summary: Summary) => Summary) {
    this.summary = summarizer(this.summary)
  }
}


class ValidateMode<T> implements Mode<T> {
  constructor(private context: T) { }

  async handleAssumption(run: ExampleRun<T>, scriptContext: ScriptContext<T>, condition: Condition<T>): Promise<void> {
    const assumptionResult = await condition.validate(this.context)
    run.reporter.recordAssumption(scriptContext, condition, assumptionResult)
    assumptionResult.when({
      valid: () => {
        run.updateSummary(addValid)
      },
      invalid: () => {
        run.updateSummary(addInvalid)
        run.mode = new SkipMode()
      }
    })
  }

  async handleObservation(run: ExampleRun<T>, scriptContext: ScriptContext<T>, effect: Effect<T>): Promise<void> {
    const observationResult = await effect.validate(this.context)
    run.reporter.recordObservation(scriptContext, effect, observationResult)
    observationResult.when({
      valid: () => {
        run.updateSummary(addValid)
      },
      invalid: () => {
        run.updateSummary(addInvalid)
      }
    })
  }
}

class SkipMode<T> implements Mode<T> {
  async handleAssumption(run: ExampleRun<T>, _: ScriptContext<T>, condition: Condition<T>): Promise<void> {
    run.reporter.skipAssumption(condition)
    run.updateSummary(addSkipped)
  }

  async handleObservation(run: ExampleRun<T>, _: ScriptContext<T>, effect: Effect<T>): Promise<void> {
    run.reporter.skipObservation(effect)
    run.updateSummary(addSkipped)
  }
}