import { ConfigurableBehavior } from "./Behavior.js"
import { OrderProvider } from "./OrderProvider.js"
import { NullReporter, Reporter } from "./Reporter.js"
import { Summary, addBehavior, addSummary, emptySummary } from "./Summary.js"
import { BehaviorRunner, FailFastBehaviorRunner, PickedOnlyBehaviorRunner, SkipBehaviorRunner, StandardBehaviorRunner } from "./BehaviorRunner.js"

export interface BehaviorValidationOptions {
  reporter: Reporter
  orderProvider: OrderProvider
  failFast: boolean
  runPickedOnly: boolean
}

export class DocumentationRunner {
  private hasFailed = false
  private summary = emptySummary()

  constructor(private options: BehaviorValidationOptions) { }

  getSummary() {
    return this.summary
  }

  start() {
    this.options.reporter.start(this.options.orderProvider.description)
  }

  end() {
    this.options.reporter.end(this.summary)
  }

  async run(configurableBehavior: ConfigurableBehavior, options: BehaviorValidationOptions): Promise<Summary> {
    const runner = this.getRunner(options)

    this.summary = addBehavior(this.summary)

    const behavior = runner.start(configurableBehavior)

    for (const configurableExample of options.orderProvider.order(behavior.examples)) {
      const exampleSummary = await runner.run(configurableExample, options)
      this.summary = addSummary(this.summary, exampleSummary)
    }

    runner.end(behavior)

    if (this.summary.invalid > 0) {
      this.hasFailed = true
    }

    return this.summary
  }

  getRunner(options: BehaviorValidationOptions): BehaviorRunner {
    if (options.failFast && this.hasFailed) {
      return new SkipBehaviorRunner(new NullReporter())
    } 
    
    const runner = options.runPickedOnly ?
      new PickedOnlyBehaviorRunner(options.reporter) :
      new StandardBehaviorRunner(options.reporter)
    
    if (options.failFast) {
      return new FailFastBehaviorRunner(runner)
    }

    return runner
  }
}