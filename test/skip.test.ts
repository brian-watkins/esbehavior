import { expect } from 'chai'
import { test } from 'uvu'
import { validate, effect, example, fact, behavior, step, defaultOrder } from '../src/index.js'
import { FakeReporter, withBehavior, withExample, withSkippedClaim, withValidClaim } from './helpers/FakeReporter.js'

test("it skips an example", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("something", [
      (m) => m.skip() && example({
        init: () => {
          expect(7).to.equal(5)
          return "blah"
        }
      })
        .description("not important")
        .script({
          suppose: [
            fact("it does something bad", () => {
              throw new Error("BAD WHEN!!")
            })
          ],
          perform: [
            step("it never does this", () => {})
          ],
          observe: [
            effect("will never run this", () => {
              expect(7).to.equal(5)
            }),
            effect("or this", () => {
              expect(9).to.equal(1)
            })
          ]
        }),
      example({ init: () => "blah" })
        .description("important")
        .script({
          observe: [
            effect("will run this", () => {
              expect(7).to.equal(7)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("something", [
      withExample("not important", [
        withSkippedClaim("it does something bad"),
        withSkippedClaim("it never does this"),
        withSkippedClaim("will never run this"),
        withSkippedClaim("or this"),
      ]),
      withExample("important", [
        withValidClaim("will run this")
      ])
    ])
  ])

  reporter.expectSummary({
    behaviors: 1,
    examples: 2,
    valid: 1,
    invalid: 0,
    skipped: 4
  })
})

test.run()