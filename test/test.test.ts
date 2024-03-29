import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { example, validate, effect, fact, behavior, step, defaultOrder } from '../src/index.js'
import failingObservation from './fixtures/failingObservation.js'
import { withBehavior, withExample, FakeReporter, withValidClaim, withInvalidClaim } from './helpers/FakeReporter.js'

test("when a single valid claim is observed", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      example()
        .description("my first test")
        .script({
          observe: [
            effect("does something cool", () => {
              // nothing
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test", [
        withValidClaim("does something cool")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 1,
    invalid: 0,
    skipped: 0
  })
})

test("when multiple valid claims are observed", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      example()
        .description("several observations")
        .script({
          observe: [
            effect("does something cool", () => {
              // nothing
            }),
            effect("does something else cool", () => {
              // nothing
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("several observations", [
        withValidClaim("does something cool"),
        withValidClaim("does something else cool")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
    
  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 2,
    invalid: 0,
    skipped: 0
  })
})

test("where an invalid claim is observed", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    failingObservation
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("failing observation", [
        withInvalidClaim("failingObservation.ts:6:6", "does something that fails", {
          operator: "equals", expected: "something", actual: "nothing"
        }),
        withValidClaim("passes")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
  
  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 1,
    invalid: 1,
    skipped: 0
  })
})

test("when the example has valid assumptions", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      example({ init: () => ({ val: 0 }) })
        .description("multiple assumptions")
        .script({
          suppose: [
            fact("the value is set", (context) => { context.val = 8 })
          ],
          perform: [
            step("the value is incremented", (context) => { context.val++ }),
            step("the value is incremented", (context) => { context.val++ })
          ],
          observe: [
            effect("it compares the correct number", (context) => {
              assert.equal(context.val, 10)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("multiple assumptions", [
        withValidClaim("the value is set"),
        withValidClaim("the value is incremented"),
        withValidClaim("the value is incremented"),
        withValidClaim("it compares the correct number")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
  
  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 4,
    invalid: 0,
    skipped: 0
  })
})

test("it runs example with no description", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      example({ init: () => ({ val: 0 }) })
        .script({
          suppose: [
            fact("the value is set", (context) => { context.val = 8 })
          ],
          perform: [
            step("the value is incremented", (context) => { context.val++ }),
            step("the value is incremented", (context) => { context.val++ })
          ],
          observe: [
            effect("it compares the correct number", (context) => {
              assert.equal(context.val, 10)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample(null, [
        withValidClaim("the value is set"),
        withValidClaim("the value is incremented"),
        withValidClaim("the value is incremented"),
        withValidClaim("it compares the correct number")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
  
  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 4,
    invalid: 0,
    skipped: 0
  })
})

test.run()