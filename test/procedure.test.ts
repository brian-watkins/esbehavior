import { expect } from 'chai'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { behavior, effect, example, step, procedure,validate, skip } from '../src/index.js'
import failingNestedProcedure from './fixtures/failingNestedProcedure.js'
import failingProcedure from './fixtures/failingProcedure.js'
import { FakeReporter, withBehavior, withExample, withInvalidClaim, withInvalidClaims, withSkippedClaim, withSkippedClaims, withValidClaim, withValidClaims } from './helpers/FakeReporter.js'


test("when all steps in a procedure are valid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      example({ init: () => { return { count: 1 } } })
        .description("my first test of some procedure")
        .script({
          perform: [
            procedure("some cool sequence", [
              step("step 1", (context) => { context.count += 2 }),
              step("step 2", (context) => { context.count += 3 })
            ])
          ],
          observe: [
            effect("something cool happens", (context) => {
              expect(6).to.equal(context.count)
            })
          ]
        })
    ])
  ], { reporter })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some procedure", [
        withValidClaims("some cool sequence", [
          withValidClaim("step 1"),
          withValidClaim("step 2")
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

test("when all steps in a nested procedure are valid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      example({ init: () => { return { count: 1 } } })
        .description("my first test of some nested procedure")
        .script({
          perform: [
            procedure("some cool sequence", [
              step("step 1", (context) => { context.count += 2 }),
              procedure("some nested procedure", [
                step("nested step 1", (context) => { context.count += 8 }),
                step("nested step 2", (context) => { context.count += 10 })
              ]),
              step("step 2", (context) => { context.count += 3 })
            ]),
            step("step 5", (context) => { context.count += 6 })
          ],
          observe: [
            effect("something cool happens", (context) => {
              expect(30).to.equal(context.count)
            })
          ]
        })
    ])
  ], { reporter })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some nested procedure", [
        withValidClaims("some cool sequence", [
          withValidClaim("step 1"),
          withValidClaims("some nested procedure", [
            withValidClaim("nested step 1"),
            withValidClaim("nested step 2")
          ]),
          withValidClaim("step 2")
        ]),
        withValidClaim("step 5"),
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

test("when some steps in a procedure are invalid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    failingProcedure
  ], { reporter })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some invalid procedure", [
        withInvalidClaims("some invalid sequence", [
          withValidClaim("step 1"),
          withInvalidClaim("failingProcedure.ts:7:6", "failing step", {
            message: "Whoops!"
          }),
          withSkippedClaim("step 3")
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

test("when some steps in a nested procedure are invalid", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    failingNestedProcedure
  ], { reporter })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some invalid nested procedure", [
        withInvalidClaims("some invalid sequence", [
          withValidClaim("step 1"),
          withInvalidClaims("a failing nested procedure", [
            withValidClaim("nested step 1"),
            withInvalidClaim("failingNestedProcedure.ts:7:6", "failing nested step", {
              message: "Whoops!"
            }),
            withSkippedClaim("nested step 3")
          ]),
          withSkippedClaim("step 3"),
          withSkippedClaims("another procedure", [
            withSkippedClaim("another step 1"),
            withSkippedClaim("another step 2")
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

test("when a procedure is skipped", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      skip.example({ init: () => { return { count: 1 } } })
        .description("my first test of some procedure")
        .script({
          perform: [
            procedure("some cool sequence", [
              step("step 1", (context) => { context.count += 2 }),
              step("step 2", (context) => { context.count += 3 })
            ])
          ],
          observe: [
            effect("something cool happens", (context) => {
              expect(6).to.equal(context.count)
            })
          ]
        })
    ])
  ], { reporter })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some procedure", [
        withSkippedClaims("some cool sequence", [
          withSkippedClaim("step 1"),
          withSkippedClaim("step 2")
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

test("when a nested procedure is skipped", async () => {
  const reporter = new FakeReporter()

  const actualSummary = await validate([
    behavior("a single test", [
      skip.example({ init: () => { return { count: 1 } } })
        .description("my first test of some skipped procedure")
        .script({
          perform: [
            procedure("some cool sequence", [
              step("step 1", (context) => { context.count += 2 }),
              step("step 2", (context) => { context.count += 3 }),
              procedure("skipped procedure", [
                step("nested step 1", () => {}),
                step("nested step 2", () => {}),
              ])
            ])
          ],
          observe: [
            effect("something cool happens", (context) => {
              expect(6).to.equal(context.count)
            })
          ]
        })
    ])
  ], { reporter })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("my first test of some skipped procedure", [
        withSkippedClaims("some cool sequence", [
          withSkippedClaim("step 1"),
          withSkippedClaim("step 2"),
          withSkippedClaims("skipped procedure", [
            withSkippedClaim("nested step 1"),
            withSkippedClaim("nested step 2")
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