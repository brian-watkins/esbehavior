import { test } from "uvu";
import * as assert from 'uvu/assert'
import { behaviorUsing, Context, defaultOrder, effect, example, validate } from "../src";
import { FakeReporter, withBehavior, withExample, withSkippedClaim, withValidClaim } from "./helpers/FakeReporter";

test("behavior with a context", async () => {
  const reporter = new FakeReporter()
  const testContext = new TestContext()
  const exampleContext = new TestExampleContext()

  const upgradedBehavior = behaviorUsing(testContext)

  await validate([
    upgradedBehavior("my behavior with a context", use => [
      example(use(exampleContext))
        .description("example 1")
        .script({
          observe: [
            effect("it checks things", (context) => {
              assert.equal(context, "example plus blah")
            })
          ]
        }),
      example(use(exampleContext))
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
        withValidClaim("it checks things")
      ]),
      withExample("example 2", [
        withValidClaim("it checks more things")
      ])
    ])
  ])

  assert.equal(exampleContext.calledInit, 2)
  assert.equal(exampleContext.calledTeardownWith, [ "example plus blah", "example plus blah" ])

  assert.equal(testContext.calledInit, 1)
  assert.equal(testContext.calledTeardownWith, [ "blah" ])
})

test("all examples are skipped", async () => {
  const reporter = new FakeReporter()
  const testContext = new TestContext()
  const exampleContext = new TestExampleContext()

  const upgradedBehavior = behaviorUsing(testContext)

  await validate([
    upgradedBehavior("my behavior with a context", use => [
      (m) => m.skip() && example(use(exampleContext))
        .description("example 1")
        .script({
          observe: [
            effect("it checks things", (context) => {
              assert.equal(context, "example plus blah")
            })
          ]
        }),
      (m) => m.skip() && example(use(exampleContext))
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

class TestExampleContext implements Context<string, string> {
  calledInit: number = 0
  calledTeardownWith: Array<string> = []
  
  async init(word: string): Promise<string> {
    this.calledInit++
    return `example plus ${word}`
  }

  async teardown(context: string): Promise<void> {
    this.calledTeardownWith.push(context)
  }
}


test.run()