import { expect } from 'chai'
import { test } from 'uvu'
import { validate, pick, example, effect, condition, behavior } from '../src/index.js'
import { FakeReporter, withBehavior, withExample, withSkippedClaim, withValidClaim } from './helpers/FakeReporter.js'

test("it only runs and reports on the picked example", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("something", [
      example()
        .description("not important")
        .script({
          prepare: [
            condition("it does something bad", () => {
              throw new Error("BAD WHEN!!")
            })
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
      pick.example()
        .description("important")
        .script({
          observe: [
            effect("will run this", () => {
              expect(7).to.equal(7)
            })
          ]
        })
    ]),
    behavior("another", [
      example({
        init: () => {
          throw new Error("BAD SO BAD")
        }
      })
        .description("should be skipped")
        .script({
          prepare: [
            condition("it does something that it shouldn't", () => {
              throw new Error("BAD!")
            })
          ],
          observe: [
            effect("just won't", () => {
              expect(7).to.equal(4)
            })
          ]
        })
    ])
  ], { reporter })

  reporter.expectReport([
    withBehavior("something", [
      withExample("important", [
        withValidClaim("will run this")
      ])
    ]),
  ])

  reporter.expectSummary({
    behaviors: 2,
    examples: 3,
    valid: 1,
    invalid: 0,
    skipped: 5
  })
})

test.run()