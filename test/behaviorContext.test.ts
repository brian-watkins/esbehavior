import { test } from "uvu";
import * as assert from 'uvu/assert'
import { behavior, behaviorContext, Context, defaultOrder, effect, example, validate } from "../src";
import { FakeReporter, withBehavior, withExample, withSkippedClaim, withValidClaim } from "./helpers/FakeReporter";

test("behavior with a context", async () => {
  const reporter = new FakeReporter()
  const contextForTheBehavior = new TestContext()

  const testContext = behaviorContext(contextForTheBehavior)

  await validate([
    behavior("my behavior with a context", [
      example(testContext)
        .description("example 1")
        .script({
          observe: [
            effect("it checks things", (context) => {
              assert.equal(context, "blah")
            })
          ]
        }),
      example(testContext)
        .description("example 2")
        .script({
          observe: [
            effect("it checks more things", (context) => {
              assert.equal(context, "blah")
            })
          ]
        }),
    ]),
    behavior("another behavior with a behavior context", [
      example(testContext)
        .description("example 3")
        .script({
          observe: [
            effect("it checks all the things", (context) => {
              assert.equal(context, "blah")
            })
          ]
        }),

    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("my behavior with a context", [
      withExample("example 1", [
        withValidClaim("it checks things")
      ]),
      withExample("example 2", [
        withValidClaim("it checks more things")
      ])
    ]),
    withBehavior("another behavior with a behavior context", [
      withExample("example 3", [
        withValidClaim("it checks all the things")
      ])
    ])
  ])

  assert.equal(contextForTheBehavior.calledInit, 2)
  assert.equal(contextForTheBehavior.calledTeardownWith, ["blah", "blah"])
})

test("all examples are skipped", async () => {
  const reporter = new FakeReporter()
  const contextForTheBehavior = new TestContext()

  const testContext = behaviorContext(contextForTheBehavior)

  await validate([
    behavior("my behavior with a context", [
      (m) => m.skip() && example(testContext)
        .description("example 1")
        .script({
          observe: [
            effect("it checks things", (context) => {
              assert.equal(context, "example plus blah")
            })
          ]
        }),
      (m) => m.skip() && example(testContext)
        .description("example 2")
        .script({
          observe: [
            effect("it checks more things", (context) => {
              assert.equal(context, "example plus blah")
            })
          ]
        }),
    ])
  ], { reporter, order: defaultOrder() })

  reporter.expectReport([
    withBehavior("my behavior with a context", [
      withExample("example 1", [
        withSkippedClaim("it checks things")
      ]),
      withExample("example 2", [
        withSkippedClaim("it checks more things")
      ])
    ])
  ])

  assert.equal(contextForTheBehavior.calledInit, 0)
  assert.equal(contextForTheBehavior.calledTeardownWith, [])
})


class TestContext implements Context<string> {
  calledInit: number = 0
  calledTeardownWith: Array<string> = []

  async init(): Promise<string> {
    this.calledInit++
    return "blah"
  }

  async teardown(context: string): Promise<void> {
    this.calledTeardownWith.push(context)
  }
}


test.run()