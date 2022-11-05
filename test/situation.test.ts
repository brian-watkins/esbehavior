import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { behavior, effect, example, situation, validate, fact, defaultOrder } from '../src/index.js'
import failingNestedSituation from './fixtures/failingNestedSituation.js'
import failingSituation from './fixtures/failingSituation.js'
import { FakeReporter, withBehavior, withExample, withInvalidClaim, withInvalidClaims, withSkippedClaim, withSkippedClaims, withValidClaim, withValidClaims } from './helpers/FakeReporter.js'

test("when all facts in a situation are valid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      example({ init: () => { return { count: 1, name: "blah" } } })
        .description("my first test of some situation")
        .script({
          suppose: [
            situation("things are the case", [
              fact("the count is 4", (context) => { context.count = 4 }),
              fact("the name is cool dude", (context) => { context.name = "Cool Dude" })
            ])
          ],
          observe: [
            effect("something cool happens", (context) => {
              assert.equal(context.count, 4)
              assert.equal(context.name, "Cool Dude")
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some situation", [
        withValidClaims("things are the case", [
          withValidClaim("the count is 4"),
          withValidClaim("the name is cool dude")
        ]),
        withValidClaim("something cool happens")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 3,
    invalid: 0,
    skipped: 0
  })
})

test("when all facts in a nested situation are valid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      example({ init: () => { return { count: 1, names: [] } as { count: number, names: Array<string> } } })
        .description("my first test of some nested situation")
        .script({
          suppose: [
            situation("some cool situation", [
              fact("fact 1", (context) => { context.names.push("a") }),
              situation("some nested situation", [
                fact("the count is set", (context) => { context.count = 8 }),
                fact("the name is set", (context) => { context.names.push("Larry") })
              ]),
              fact("fact 2", (context) => { context.names.push("b") })
            ]),
            fact("fact 5", (context) => { context.names.push("c") })
          ],
          observe: [
            effect("something cool happens", (context) => {
              assert.equal(context.count, 8)
              assert.equal(context.names, ["a", "Larry", "b", "c"])
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some nested situation", [
        withValidClaims("some cool situation", [
          withValidClaim("fact 1"),
          withValidClaims("some nested situation", [
            withValidClaim("the count is set"),
            withValidClaim("the name is set")
          ]),
          withValidClaim("fact 2")
        ]),
        withValidClaim("fact 5"),
        withValidClaim("something cool happens")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 6,
    invalid: 0,
    skipped: 0
  })
})

test("when some facts in a situation are invalid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    failingSituation
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some invalid situation", [
        withInvalidClaims("some invalid situation", [
          withValidClaim("fact 1"),
          withInvalidClaim("failingSituation.ts:7:6", "failing fact", {
            message: "Whoops!"
          }),
          withSkippedClaim("fact 3")
        ]),
        withSkippedClaim("something cool happens")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 1,
    invalid: 1,
    skipped: 2
  })
})

test("when some facts in a nested situation are invalid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    failingNestedSituation
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some invalid nested situation", [
        withInvalidClaims("some invalid situation", [
          withValidClaim("fact 1"),
          withInvalidClaims("a failing nested situation", [
            withValidClaim("nested fact 1"),
            withInvalidClaim("failingNestedSituation.ts:7:6", "failing nested fact", {
              message: "Whoops!"
            }),
            withSkippedClaim("nested fact 3")
          ]),
          withSkippedClaim("fact 3"),
          withSkippedClaims("another situation", [
            withSkippedClaim("another fact 1"),
            withSkippedClaim("another fact 2")
          ])
        ]),
        withSkippedClaim("something cool happens")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 2,
    invalid: 1,
    skipped: 5
  })
})

test("when a situation is skipped", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      (m) => m.skip() && example({ init: () => { return { count: 1 } } })
        .description("my first test of some skipped situation")
        .script({
          suppose: [
            situation("some cool situation", [
              fact("fact 1", (context) => { context.count += 2 }),
              fact("fact 2", (context) => { context.count += 3 })
            ])
          ],
          observe: [
            effect("something cool happens", (context) => {
              assert.equal(context.count, 6)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some skipped situation", [
        withSkippedClaims("some cool situation", [
          withSkippedClaim("fact 1"),
          withSkippedClaim("fact 2")
        ]),
        withSkippedClaim("something cool happens")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 0,
    invalid: 0,
    skipped: 3
  })
})

test("when a nested situation is skipped", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      (m) => m.skip() && example({ init: () => { return { count: 1 } } })
        .description("my first test of some skipped situation")
        .script({
          suppose: [
            situation("some cool situation", [
              fact("fact 1", (context) => { context.count += 2 }),
              fact("fact 2", (context) => { context.count += 3 }),
              situation("skipped situation", [
                fact("nested fact 1", () => {}),
                fact("nested fact 2", () => {}),
              ])
            ])
          ],
          observe: [
            effect("something cool happens", (context) => {
              assert.equal(context.count, 6)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some skipped situation", [
        withSkippedClaims("some cool situation", [
          withSkippedClaim("fact 1"),
          withSkippedClaim("fact 2"),
          withSkippedClaims("skipped situation", [
            withSkippedClaim("nested fact 1"),
            withSkippedClaim("nested fact 2")
          ])
        ]),
        withSkippedClaim("something cool happens")
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 0,
    invalid: 0,
    skipped: 5
  })
})


test.run()