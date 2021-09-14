import { Reporter } from "./Reporter.js"
import { addInvalid, addSkipped, addValid, emptySummary, Summary } from "./Summary.js"
import { waitFor } from "./waitFor.js"
import { Effect } from "./Effect.js"
import { Condition } from "./Condition.js"

export interface Example {
  runMode: RunMode
  run(reporter: Reporter): Promise<Summary>
  skip(reporter: Reporter): Promise<Summary>
}

export interface Script<T> {
  conditions: Array<Condition<T>>
  effects: Array<Effect<T>>
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
  script({ prepare, observe }: { prepare?: Array<Condition<T>>, observe: Array<Effect<T>> }): ExampleScriptsBuilder<T>
}

export interface ExampleScriptBuilder<T> extends ExampleBuilder<T> {
  script({ prepare, observe }: { prepare?: Array<Condition<T>>, observe: Array<Effect<T>> }): ExampleScriptsBuilder<T>
}

export interface ExampleScriptsBuilder<T> extends ExampleBuilder<T> {
  andThen({ prepare, observe }: { prepare?: Array<Condition<T>>, observe: Array<Effect<T>> }): ExampleScriptsBuilder<T>
}

export class BDVPExampleBuilder<T> implements ExampleBuilder<T>, ExampleSetupBuilder<T>, ExampleScriptBuilder<T>, ExampleScriptsBuilder<T> {
  private example: BDVPExample<T>

  constructor(public runMode: RunMode, context: Context<T>) {
    this.example = new BDVPExample(runMode, context)
  }

  description(description: string): ExampleScriptBuilder<T> {
    this.example.setDescription(description)
    return this
  }

  script({ prepare = [], observe }: { prepare?: Array<Condition<T>>, observe: Array<Effect<T>> }): ExampleScriptsBuilder<T> {
    this.example.setScript({ conditions: prepare, effects: observe })
    return this
  }

  andThen({ prepare = [], observe }: { prepare?: Array<Condition<T>>, observe: Array<Effect<T>> }): ExampleScriptsBuilder<T> {
    this.example.addScript({ conditions: prepare, effects: observe })
    return this
  }

  build(): Example {
    return this.example
  }
}

export class BDVPExample<T> implements Example {
  private description?: string
  private scripts: Array<Script<T>> = []

  constructor(public runMode: RunMode, public context: Context<T>) { }

  setDescription(description: string) {
    this.description = description
  }

  setScript(script: Script<T>) {
    this.scripts = [script]
  }

  addScript(script: Script<T>) {
    this.scripts.push(script)
  }

  async run(reporter: Reporter): Promise<Summary> {
    reporter.startExample(this.description)

    const context = await waitFor(this.context.init())

    const run = new ExampleRun<T>(new ValidateMode(context), reporter)

    await run.execute(this.scripts)

    await waitFor(this.context.teardown?.(context))

    return run.summary
  }

  async skip(reporter: Reporter): Promise<Summary> {
    reporter.startExample(this.description)

    const run = new ExampleRun<T>(new SkipMode(), reporter)
    
    await run.execute(this.scripts)

    return run.summary
  }
}

interface Mode<T> {
  handleAssumption(run: ExampleRun<T>, condition: Condition<T>): Promise<void>
  handleObservation(run: ExampleRun<T>, effect: Effect<T>): Promise<void>
}

class ExampleRun<T> {
  public summary = emptySummary()

  constructor (
    public mode: Mode<T>,
    public reporter: Reporter,
  ) {}

  async execute(scripts: Array<Script<T>>): Promise<void> {
    for (let script of scripts) {
      await this.runScript(script)

      if (this.summary.invalid > 0) {
        this.mode = new SkipMode()
      }
    }
  }

  private async runScript(script: Script<T>): Promise<void> {
    for (let condition of script.conditions) {
      await this.mode.handleAssumption(this, condition)
    }

    for (let effect of script.effects) {
      await this.mode.handleObservation(this, effect)
    }
  }

  updateSummary(summarizer: (summary: Summary) => Summary) {
    this.summary = summarizer(this.summary)
  }
}


class ValidateMode<T> implements Mode<T> {
  constructor(private context: T) {}

  async handleAssumption(run: ExampleRun<T>, condition: Condition<T>): Promise<void> {
    const assumptionResult = await condition.validate(this.context)
    run.reporter.recordAssumption(condition, assumptionResult)
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

  async handleObservation(run: ExampleRun<T>, effect: Effect<T>): Promise<void> {
    const observationResult = await effect.validate(this.context)
    run.reporter.recordObservation(effect, observationResult)
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
  async handleAssumption(run: ExampleRun<T>, condition: Condition<T>): Promise<void> {
    run.reporter.skipAssumption(condition)
    run.updateSummary(addSkipped)
  }

  async handleObservation(run: ExampleRun<T>, effect: Effect<T>): Promise<void> {
    run.reporter.skipObservation(effect)
    run.updateSummary(addSkipped)
  }
}