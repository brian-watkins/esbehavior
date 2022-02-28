import { test } from 'uvu'
import { validate, example, effect, behavior } from '../src/index.js'
import { expect } from 'chai'
import { FakeReporter, withBehavior, withExample, withValidClaim } from './helpers/FakeReporter.js'

test("it runs multiple behaviors", async () => {
  const reporter = new FakeReporter()

  await validate([
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
  ], { reporter })

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

  reporter.expectSummary({
    behaviors: 2,
    examples: 2,
    valid: 2,
    invalid: 0,
    skipped: 0
  })
})

test.run()