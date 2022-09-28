import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { behavior, defaultOrder, effect, example, validate } from '../src/index.js'
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
        withInvalidClaim("multipleExamplesOneFails.ts:6:6", "does something that fails", {
          operator: "equals", expected: "something", actual: "nothing"
        }),
        withValidClaim("passes")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
  
  assert.equal(actualSummary, {
    behaviors: 4,
    examples: 5,
    valid: 2,
    invalid: 1,
    skipped: 4
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
        withInvalidClaim("multiplePickedExamplesOneFails.ts:6:6", "does something that fails", {
          operator: "equals", expected: "something", actual: "nothing"
        }),
        withValidClaim("passes")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
  
  assert.equal(actualSummary, {
    behaviors: 3,
    examples: 7,
    valid: 1,
    invalid: 1,
    skipped: 10
  })
})



test.run()