import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { validate } from '../src/index.js'
import failingCondition from './fixtures/failingCondition.js'
import failingStep from './fixtures/failingStep.js'
import { FakeReporter, withBehavior, withExample, withInvalidClaim, withSkippedClaim } from './helpers/FakeReporter.js'

test("failing condition", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    failingCondition
  ], { reporter })

  reporter.expectReport([
    withBehavior("behavior", [
      withExample("failing condition", [
        withInvalidClaim("failingCondition.ts:6:6", "something throws an error", { 
          operator: "equals", expected: "something", actual: "nothing"
        }),
        withSkippedClaim("there is another condition"),
        withSkippedClaim("does something that will get skipped")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
  
  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 0,
    invalid: 1,
    skipped: 2, 
  })
})

test("failing step", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    failingStep
  ], { reporter })

  reporter.expectReport([
    withBehavior("behavior", [
      withExample("failing step", [
        withInvalidClaim("failingStep.ts:6:6", "something throws an error", {
          operator: "equals", expected: "a", actual: "b"
        }),
        withSkippedClaim("there is another step"),
        withSkippedClaim("does something that will get skipped")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
  
  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 0,
    invalid: 1,
    skipped: 2
  })
})

test.run()