import * as assert from "uvu/assert"
import { test } from 'uvu'
import { validate, example, effect, fact, behavior, defaultOrder } from '../src/index.js'
import { FakeReporter, withBehavior, withExample, withValidClaim } from './helpers/FakeReporter.js'

test("it only runs and resports on picked behaviors", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("skip it", [
      example()
        .description("won't run")
        .script({
          observe: [
            effect("would fail", () => {
              throw new Error("BAD!!")
            })
          ]
        })
    ]),
    (m) => m.pick() && behavior("run it", [
      example()
        .description("important")
        .script({
          observe: [
            effect("will run this", () => {
              assert.equal(7, 7)
            })
          ]
        }),
      (m) => m.skip() && example()
        .description("I'm skipped")
        .script({
          observe: [
            effect("will not run", () => {
              throw new Error("WHAT?!??!")
            })
          ]
        }),
      example()
        .description("important number 2")
        .script({
          observe: [
            effect("will run this also", () => {
              assert.equal(7, 7)
            })
          ]
        })
    ]),
    behavior("also skip it", [
      example()
        .description("not important")
        .script({
          observe: [
            effect("will not run this", () => {
              throw new Error("Boo!")
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("run it", [
      withExample("important", [
        withValidClaim("will run this")
      ]),
      withExample("important number 2", [
        withValidClaim("will run this also")
      ])
    ]),
  ])

  reporter.expectSummary({
    behaviors: 3,
    examples: 5,
    valid: 2,
    invalid: 0,
    skipped: 3
  })
})

test("it only runs behavior that is picked, even if it has no examples", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("skip it", [
      example()
        .description("won't run")
        .script({
          observe: [
            effect("would fail", () => {
              throw new Error("BAD!!")
            })
          ]
        })
    ]),
    (m) => m.pick() && behavior("run it", []),
    behavior("also skip it", [
      example()
        .description("not important")
        .script({
          observe: [
            effect("will not run this", () => {
              throw new Error("Boo!")
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("run it", []),
  ])

  reporter.expectSummary({
    behaviors: 3,
    examples: 2,
    valid: 0,
    invalid: 0,
    skipped: 2
  })
})

test("it only runs and reports on the picked example", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("something", [
      example()
        .description("not important")
        .script({
          suppose: [
            fact("it does something bad", () => {
              throw new Error("BAD WHEN!!")
            })
          ],
          observe: [
            effect("will never run this", () => {
              assert.equal(7, 5)
            }),
            effect("or this", () => {
              assert.equal(9, 1)
            })
          ]
        }),
      (m) => m.pick() && example()
        .description("important")
        .script({
          observe: [
            effect("will run this", () => {
              assert.equal(7, 7)
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
          suppose: [
            fact("it does something that it shouldn't", () => {
              throw new Error("BAD!")
            })
          ],
          observe: [
            effect("just won't", () => {
              assert.equal(7, 4)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

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