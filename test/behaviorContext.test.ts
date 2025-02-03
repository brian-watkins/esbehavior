import { test } from "uvu";
import * as assert from 'uvu/assert'
import { behavior, behaviorContext, Context, contextGenerator, defaultOrder, effect, example, validate } from "../src";
import { FakeReporter, withBehavior, withExample, withSkippedClaim, withValidClaim } from "./helpers/FakeReporter";

test("behavior with a context", async () => {
  const reporter = new FakeReporter()
  const contextForTheBehavior = new TestContext()
  const exampleContext = new TestExampleContext()

  const withContext = contextGenerator({
    behaviorScoped: behaviorContext(contextForTheBehavior)
  })

  await validate([
    behavior("my behavior with a context", [
      example(withContext(exampleContext))
        .description("example 1")
        .script({
          observe: [
            effect("it checks things", (context) => {
              assert.equal(context, "example plus blah")
            })
          ]
        }),
      example(withContext(exampleContext))
        .description("example 2")
        .script({
          observe: [
            effect("it checks more things", (context) => {
              assert.equal(context, "example plus blah")
            })
          ]
        }),
    ]),
    behavior("another behavior with a behavior context", [
      example(withContext(exampleContext))
        .description("example 3")
        .script({
          observe: [
            effect("it checks all the things", (context) => {
              assert.equal(context, "example plus blah")
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

  assert.equal(exampleContext.calledInit, 3)
  assert.equal(exampleContext.calledTeardownWith, ["example plus blah", "example plus blah", "example plus blah"])

  assert.equal(contextForTheBehavior.calledInit, 2)
  assert.equal(contextForTheBehavior.calledTeardownWith, ["blah", "blah"])
})

test("all examples are skipped", async () => {
  const reporter = new FakeReporter()
  const testContext = new TestContext()
  const exampleContext = new TestExampleContext()

  const withContext = contextGenerator({
    behaviorScoped: behaviorContext(testContext)
  })

  await validate([
    behavior("my behavior with a context", [
      (m) => m.skip() && example(withContext(exampleContext))
        .description("example 1")
        .script({
          observe: [
            effect("it checks things", (context) => {
              assert.equal(context, "example plus blah")
            })
          ]
        }),
      (m) => m.skip() && example(withContext(exampleContext))
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

  assert.equal(exampleContext.calledInit, 0)
  assert.equal(exampleContext.calledTeardownWith, [])

  assert.equal(testContext.calledInit, 0)
  assert.equal(testContext.calledTeardownWith, [])
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

class TestExampleContext implements Context<string, { behaviorScoped: string }> {
  calledInit: number = 0
  calledTeardownWith: Array<string> = []

  async init(initialValue: { behaviorScoped: string }): Promise<string> {
    this.calledInit++
    return `example plus ${initialValue.behaviorScoped}`
  }

  async teardown(context: string): Promise<void> {
    this.calledTeardownWith.push(context)
  }
}


test.run()