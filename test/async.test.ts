import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { validate, example, fact, effect, behavior, defaultOrder } from '../src/index.js'
import { FakeReporter, withBehavior, withExample, withInvalidClaim, withValidClaim } from './helpers/FakeReporter.js'
import { asyncBehavior, teardownValue } from './fixtures/asyncBehavior.js'

test("it runs an example with an async given", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("a single test", [
      example({
        init: () => {
          return new Promise(resolve => {
            setTimeout(() => resolve(7), 30)
          })
        }
      })
        .description("async given")
        .script({
          observe: [
            effect("compares the right numbers", (actual) => {
              assert.equal(actual, 7, "it does the thing")
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("async given", [
        withValidClaim("compares the right numbers")
      ])
    ])
  ])

  reporter.expectSummary({
    behaviors: 1,
    examples: 1,
    valid: 1,
    invalid: 0,
    skipped: 0
  })
})

test("it runs an example with an async context generator and async observation", async () => {
  const reporter = new FakeReporter()

  await validate([
    asyncBehavior
  ], { reporter, order: defaultOrder() })

  assert.equal(teardownValue, 9, "it executes the async teardown function on the context")

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("async context and observation", [
        withInvalidClaim("asyncBehavior.ts:23:6", "async compares the right numbers", {
          operator: "strictEqual",
          expected: 15,
          actual: 12,
          stack: "fake stack"
        }),
        withValidClaim("does something sync")
      ])
    ])
  ])

  reporter.expectSummary({
    behaviors: 1,
    examples: 1,
    valid: 1,
    invalid: 1,
    skipped: 0
  })
})

test("it runs async conditions", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("a single test", [
      example({
        init: () => ({ val: 7 })
      })
        .description("multiple conditions")
        .script({
          suppose: [
            fact("the value is incremented", (context) => { context.val++ }),
            fact("the value is incremented asynchronously", (context) => {
              return new Promise(resolve => {
                setTimeout(() => {
                  context.val++
                  resolve()
                }, 30)
              })
            }),
            fact("the value is incremented", (context) => { context.val++ })
          ],
          observe: [
            effect("compares the correct number", (context) => {
              assert.equal(context.val, 10)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("multiple conditions", [
        withValidClaim("the value is incremented"),
        withValidClaim("the value is incremented asynchronously"),
        withValidClaim("the value is incremented"),
        withValidClaim("compares the correct number"),
      ])
    ])
  ])

  reporter.expectSummary({
    behaviors: 1,
    examples: 1,
    valid: 4,
    invalid: 0,
    skipped: 0
  })
})

test.run()