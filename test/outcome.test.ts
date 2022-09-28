import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { behavior, defaultOrder, effect, example, outcome, skip, validate } from '../src/index.js'
import failingNestedOutcome from './fixtures/failingNestedOutcome.js'
import failingOutcome from './fixtures/failingOutcome.js'
import { FakeReporter, withBehavior, withExample, withInvalidClaim, withInvalidClaims, withSkippedClaim, withSkippedClaims, withValidClaim, withValidClaims } from './helpers/FakeReporter.js'

test("when all effects in an outcome are valid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      example()
        .description("my first test of some outcome")
        .script({
          observe: [
            outcome("some cool outcome is achieved", [
              effect("something cool happens", () => {
                // nothing
              }),
              effect("another thing cool happens", () => {
                //nothing
              })
            ])
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some outcome", [
        withValidClaims("some cool outcome is achieved", [
          withValidClaim("something cool happens"),
          withValidClaim("another thing cool happens")
        ])
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

test("when outcomes are nested and all claims are valid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      example()
        .description("my nested outcome")
        .script({
          observe: [
            outcome("some cool outcome is achieved", [
              effect("something cool happens", () => {
                // nothing
              }),
              outcome("some nested outcome!", [
                effect("another thing cool happens", () => {
                  //nothing
                }),
                effect("another piece of the puzzle", () => {
                  //nothing
                })  
              ])
            ])
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my nested outcome", [
        withValidClaims("some cool outcome is achieved", [
          withValidClaim("something cool happens"),
          withValidClaims("some nested outcome!", [
            withValidClaim("another thing cool happens"),
            withValidClaim("another piece of the puzzle")
          ])
        ])
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


test("when some claims in an outcome are invalid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    failingOutcome
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("failing outcome", [
        withValidClaim("does something that works"),
        withInvalidClaims("an outcome that fails", [
          withInvalidClaim("failingOutcome.ts:6:6", "failing claim", {
            operator: "equals", expected: "something", actual: "nothing"
          }),
          withValidClaim("part of the outcome that is valid")
        ])
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 2,
    invalid: 1,
    skipped: 0
  })
})

test("when some claims in a nested outcome are invalid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    failingNestedOutcome
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("failing nested outcome", [
        withValidClaim("does something that works"),
        withInvalidClaims("an outcome that fails", [
          withInvalidClaims("a failing child outcome", [
            withValidClaim("valid claim"),
            withInvalidClaim("failingNestedOutcome.ts:6:6", "failing claim", {
              operator: "equals", expected: "something", actual: "nothing"
            }),
            withInvalidClaim("failingNestedOutcome.ts:6:6", "another failing claim", {
              operator: "equals", expected: "something", actual: "nothing"
            }),
          ]),
          withValidClaim("part of the outcome that is valid")
        ]),
        withInvalidClaim("failingNestedOutcome.ts:6:6", "third failing claim", {
          operator: "equals", expected: "something", actual: "nothing"
        }),
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 3,
    invalid: 3,
    skipped: 0
  })
})

test("when an outcome is skipped", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      skip.example()
        .description("my first test of some skipped outcome")
        .script({
          observe: [
            outcome("some cool outcome is skipped", [
              effect("something cool happens", () => {
                // nothing
              }),
              effect("another thing cool happens", () => {
                //nothing
              })
            ])
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some skipped outcome", [
        withSkippedClaims("some cool outcome is skipped", [
          withSkippedClaim("something cool happens"),
          withSkippedClaim("another thing cool happens")
        ])
      ])
    ])
  ])

  reporter.expectSummary(actualSummary)

  assert.equal(actualSummary, {
    behaviors: 1,
    examples: 1,
    valid: 0,
    invalid: 0,
    skipped: 2
  })
})

test("when nested outcomes are skipped", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      skip.example()
        .description("my nested skipped outcome")
        .script({
          observe: [
            outcome("some cool outcome is skipped for now", [
              effect("something cool happens", () => {
                // nothing
              }),
              outcome("some nested outcome is skipped", [
                effect("another thing cool happens", () => {
                  //nothing
                }),
                effect("another piece of the puzzle", () => {
                  //nothing
                })
              ])
            ])
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my nested skipped outcome", [
        withSkippedClaims("some cool outcome is skipped for now", [
          withSkippedClaim("something cool happens"),
          withSkippedClaims("some nested outcome is skipped", [
            withSkippedClaim("another thing cool happens"),
            withSkippedClaim("another piece of the puzzle")
          ])
        ])
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


test.run()