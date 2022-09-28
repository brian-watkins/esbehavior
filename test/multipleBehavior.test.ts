import { test } from 'uvu'
import { validate, example, effect, behavior, defaultOrder } from '../src/index.js'
import { expect } from 'chai'
import { FakeReporter, withBehavior, withExample, withValidClaim } from './helpers/FakeReporter.js'
import * as assert from 'uvu/assert'
import { FakeOrderProvider } from './helpers/FakeOrderProvider.js'

test("it runs multiple behaviors", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single claim", [
      example({ init: () => 7 })
        .description("just a claim")
        .script({
          observe: [
            effect("compares the correct number", (actual) => {
              expect(actual).to.equal(7)
            })
          ]
        })
    ]),
    behavior("another claim", [
      example({ init: () => 18 })
        .description("just another claim")
        .script({
          observe: [
            effect("compares another correct number", (actual) => {
              expect(actual).to.equal(18)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single claim", [
      withExample("just a claim", [
        withValidClaim("compares the correct number")
      ])
    ]),
    withBehavior("another claim", [
      withExample("just another claim", [
        withValidClaim("compares another correct number")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)
  
  assert.equal(actualSummary, {
    behaviors: 2,
    examples: 2,
    valid: 2,
    invalid: 0,
    skipped: 0
  })
})

test("it uses the order provider to order the behaviors", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("first claim", [
      example({ init: () => 7 })
        .description("just a claim")
        .script({
          observe: [
            effect("compares the correct number", (actual) => {
              expect(actual).to.equal(7)
            })
          ]
        })
    ]),
    behavior("second claim", [
      example({ init: () => 18 })
        .description("just another claim")
        .script({
          observe: [
            effect("compares another correct number", (actual) => {
              expect(actual).to.equal(18)
            })
          ]
        })
    ])
  ], { reporter, order: new FakeOrderProvider([1, 0]) })

  reporter.expectReport([
    withBehavior("second claim", [
      withExample("just another claim", [
        withValidClaim("compares another correct number")
      ])
    ]),
    withBehavior("first claim", [
      withExample("just a claim", [
        withValidClaim("compares the correct number")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 2,
    examples: 2,
    valid: 2,
    invalid: 0,
    skipped: 0
  })
})

test.run()