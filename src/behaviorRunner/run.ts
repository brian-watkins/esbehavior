import { BehaviorRunner, BehaviorValidationOptions } from "./index.js"
import { ConfigurableBehavior } from "../Behavior.js"
import { NullReporter } from "../reporter/index.js"
import { Summary, addBehavior, emptySummary, addSummary } from "../Summary.js"
import { FailFastBehaviorRunner } from "./FailFastBehaviorRunner.js"
import { PickedOnlyBehaviorRunner } from "./PickedOnlyBehaviorRunner.js"
import { SkipBehaviorRunner } from "./SkipBehaviorRunner.js"
import { StandardBehaviorRunner } from "./StandardBehaviorRunner.js"
import { teardownBehaviorContexts } from "../Context.js"

export enum ValidationStatus {
  VALID,
  INVALID
}

export async function runBehavior(options: BehaviorValidationOptions, status: ValidationStatus, configurableBehavior: ConfigurableBehavior): Promise<Summary> {
  const runner = getRunner(options, status)
  
  let summary = addBehavior(emptySummary())

  const behavior = runner.start(configurableBehavior)

  for (const configurableExample of options.orderProvider.order(behavior.examples)) {
    const exampleSummary = await runner.run(configurableExample, options)
    summary = addSummary(summary, exampleSummary)
  }

  await teardownBehaviorContexts()

  runner.end(behavior)

  return summary
}

function getRunner(options: BehaviorValidationOptions, status: ValidationStatus): BehaviorRunner {
  if (options.failFast && (status === ValidationStatus.INVALID)) {
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