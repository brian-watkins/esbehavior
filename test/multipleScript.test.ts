import { expect } from 'chai'
import { test } from 'uvu'
import { validate, effect, fact, skip, behavior, defaultOrder } from '../src/index.js'
import anotherMultipleScripts from './fixtures/anotherMultipleScripts.js'
import multipleScripts from './fixtures/multipleScripts.js'
import { FakeReporter, withBehavior, withExample, withInvalidClaim, withSkippedClaim, withValidClaim } from './helpers/FakeReporter.js'

test("it runs multiple scripts in one example", async () => {
  const reporter = new FakeReporter()

  await validate([
    multipleScripts
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("multiple scripts", [
      withExample("multiple scripts", [
        withValidClaim("it touches the context"),
        withValidClaim("the first script works"),
        withValidClaim("it touches the context again"),
        withValidClaim("it touches the context and again"),
        withValidClaim("part of the second script works"),
        withInvalidClaim("multipleScripts.ts:17:6", "the second script fails", {
          operator: "equals", expected: "a thing", actual: "nothing", stack: "cool stack"
        })
      ])
    ])
  ])

  reporter.expectSummary({
    behaviors: 1,
    examples: 1,
    valid: 5,
    invalid: 1,
    skipped: 0
  })
})

test("it skips all scripts when the example is skipped", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("example with multiple scripts", [
      skip.example({ init: () => ({ touched: 0 }) })
        .description("example is skipped")
        .script({
          suppose: [
            fact("it touches the context", (context) => { context.touched++ })
          ],
          observe: [
            effect("the first script works", (context) => {
              expect(context.touched).to.equal(1)
            })
          ]
        })
        .andThen({
          suppose: [
            fact("it touches the context again", (context) => { context.touched++ }),
            fact("it touches the context and again", (context) => { context.touched++ })
          ],
          observe: [
            effect("the second script works", (context) => {
              expect(context.touched).to.equal(3)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("example with multiple scripts", [
      withExample("example is skipped", [
        withSkippedClaim("it touches the context"),
        withSkippedClaim("the first script works"),
        withSkippedClaim("it touches the context again"),
        withSkippedClaim("it touches the context and again"),
        withSkippedClaim("the second script works")
      ])
    ])
  ])

  reporter.expectSummary({
    behaviors: 1,
    examples: 1,
    valid: 0,
    invalid: 0,
    skipped: 5
  })
})


test("it skips remaining plans if any observations fail", async () => {
  const reporter = new FakeReporter()

  await validate([
    anotherMultipleScripts
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("multiple scripts", [
      withExample("first script fails", [
        withValidClaim("it touches the context"),
        withValidClaim("the context was touched"),
        withValidClaim("it touches the context again"),
        withValidClaim("it touches the context again"),
        withInvalidClaim("anotherMultipleScripts.ts:17:6", "the second script fails", {
          operator: "equals", expected: "something", actual: "nothing", stack: "stack"
        }),
        withSkippedClaim("it touches the context another time"),
        withSkippedClaim("it touches the context for the last time"),
        withSkippedClaim("the second script would fail if not skipped")
      ])
    ])
  ])

  reporter.expectSummary({
    behaviors: 1,
    examples: 1,
    valid: 4,
    invalid: 1,
    skipped: 3
  })
})

test.run()