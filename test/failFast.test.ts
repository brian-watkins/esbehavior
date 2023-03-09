import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { behavior, defaultOrder, effect, example, validate } from '../src/index.js'
import failingAction from './fixtures/failingAction.js'
import failingCondition from './fixtures/failingCondition.js'
import multipleExamplesOneFails from './fixtures/multipleExamplesOneFails.js'
import multiplePickedExamplesOneFails from './fixtures/multiplePickedExamplesOneFails.js'
import { FakeReporter, withBehavior, withExample, withInvalidClaim, withValidClaim } from './helpers/FakeReporter.js'

const someOtherPassingBehavior = behavior("some other passing behavior", [
  example()
    .description("passing")
    .script({
      observe: [
        effect("it just passes", () => {})
      ]
    })
])

test("where an invalid claim is observed and the validation should fail fast", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    someOtherPassingBehavior,
    multipleExamplesOneFails,
    someOtherPassingBehavior,
    someOtherPassingBehavior
  ], { reporter, order: defaultOrder(), failFast: true })

  reporter.expectReport([
    withBehavior("some other passing behavior", [
      withExample("passing", [
        withValidClaim("it just passes")
      ])
    ]),
    withBehavior("multiple examples, one fails", [
      withExample("failing observation", [
        withValidClaim("passes"),
        withInvalidClaim("multipleExamplesOneFails.ts:6:6", "does something that fails", {
          operator: "equals", expected: "something", actual: "nothing"
        }),
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
  
  assert.equal(actualSummary, {
    behaviors: 4,
    examples: 5,
    valid: 2,
    invalid: 1,
    skipped: 7
  })
})

test("where an invalid picked claim is observed and the validation should fail fast", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    someOtherPassingBehavior,
    multiplePickedExamplesOneFails,
    someOtherPassingBehavior
  ], { reporter, order: defaultOrder(), failFast: true })

  reporter.expectReport([
    withBehavior("multiple picked examples, one fails", [
      withExample("failing observation", [
        withValidClaim("passes first"),
        withInvalidClaim("multiplePickedExamplesOneFails.ts:6:6", "does something that fails", {
          operator: "equals", expected: "something", actual: "nothing"
        })
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
  
  assert.equal(actualSummary, {
    behaviors: 3,
    examples: 7,
    valid: 1,
    invalid: 1,
    skipped: 11
  })
})

test("where an invalid claim occurs in a presupposition and the validation should fail fast", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    someOtherPassingBehavior,
    failingCondition,
  ], { reporter, order: defaultOrder(), failFast: true })

  reporter.expectReport([
    withBehavior("some other passing behavior", [
      withExample("passing", [
        withValidClaim("it just passes")
      ])
    ]),
    withBehavior("behavior", [
      withExample("failing condition", [
        withInvalidClaim("failingCondition.ts:6:6", "something throws an error", {
          operator: "equals", expected: "something", actual: "nothing"
        })
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
  
  assert.equal(actualSummary, {
    behaviors: 2,
    examples: 2,
    valid: 1,
    invalid: 1,
    skipped: 2
  })
})

test("where an invalid claim occurs in an action and the validation should fail fast", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    someOtherPassingBehavior,
    failingAction,
  ], { reporter, order: defaultOrder(), failFast: true })

  reporter.expectReport([
    withBehavior("some other passing behavior", [
      withExample("passing", [
        withValidClaim("it just passes")
      ])
    ]),
    withBehavior("failing", [
      withExample("failing action", [
        withInvalidClaim("failingAction.ts:10:6", "something throws an error", {
          operator: "equals", expected: "something", actual: "nothing"
        })
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 2,
    examples: 2,
    valid: 1,
    invalid: 1,
    skipped: 2
  })
})


test.run()