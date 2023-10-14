import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { validate, effect, example, fact, behavior, step, defaultOrder } from '../src/index.js'
import { FakeReporter, withBehavior, withExample, withSkippedClaim, withValidClaim } from './helpers/FakeReporter.js'

test("it skips a behavior", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("something", [
      example()
        .script({
          observe: [
            effect("this runs", () => {
              assert.equal(7, 7)
            })
          ]
        })
    ]),
    (m) => m.skip() && behavior("do not run", [
      example()
        .script({
          observe: [
            effect("this does not run", () => {
              throw new Error("ACKK!!!")
            })
          ]
        })
    ]),
    behavior("run", [
      example()
        .script({
          observe: [
            effect("do it", () => {
              assert.equal(3, 3)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("something", [
      withExample(null, [
        withValidClaim("this runs")
      ])
    ]),
    withBehavior("do not run", [
      withExample(null, [
        withSkippedClaim("this does not run")
      ])
    ]),
    withBehavior("run", [
      withExample(null, [
        withValidClaim("do it")
      ])
    ])
  ])

  reporter.expectSummary({
    behaviors: 3,
    examples: 3,
    valid: 2,
    invalid: 0,
    skipped: 1
  })

})

test("it skips a behavior even if some examples are picked", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("something", [
      example()
        .script({
          observe: [
            effect("this runs", () => {
              assert.equal(7, 7)
            })
          ]
        })
    ]),
    (m) => m.skip() && behavior("do not run", [
      example()
        .script({
          observe: [
            effect("this does not run", () => {
              throw new Error("ACKK!!!")
            })
          ]
        }),
      (m) => m.pick() && example()
        .script({
          observe: [
            effect("I want to run!", () => {})
          ]
        })
    ]),
    behavior("run", [
      example()
        .script({
          observe: [
            effect("do it", () => {
              assert.equal(3, 3)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("something", [
      withExample(null, [
        withValidClaim("this runs")
      ])
    ]),
    withBehavior("do not run", [
      withExample(null, [
        withSkippedClaim("this does not run")
      ]),
      withExample(null, [
        withSkippedClaim("I want to run!")
      ])
    ]),
    withBehavior("run", [
      withExample(null, [
        withValidClaim("do it")
      ])
    ])
  ])

  reporter.expectSummary({
    behaviors: 3,
    examples: 4,
    valid: 2,
    invalid: 0,
    skipped: 2
  })

})

test("it skips an example", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("something", [
      (m) => m.skip() && example({
        init: () => {
          assert.equal(7, 5)
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
              assert.equal(7, 5)
            }),
            effect("or this", () => {
              assert.equal(7, 5)
            })
          ]
        }),
      example({ init: () => "blah" })
        .description("important")
        .script({
          observe: [
            effect("will run this", () => {
              assert.equal(7, 7)
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