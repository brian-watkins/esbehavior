import { test } from "uvu";
import * as assert from 'uvu/assert'
import { behavior, Context, defaultOrder, effect, example, useWithContext, validate } from "../src";
import { FakeReporter, withBehavior, withExample, withValidClaim } from "./helpers/FakeReporter";

test("useWithContext", async () => {
  const reporter = new FakeReporter()
  const stringContext = new TestContext(() => "some string")
  const numberContext = new TestContext(() => 14)

  const generator = useWithContext({
    someString: stringContext,
    someNumber: numberContext
  })

  let childContext = new TestContext((initial: { someString: string, someNumber: number }) => {
    return initial.someString.length + initial.someNumber + 2
  })

  await validate([
    behavior("my behavior with a context", [
      example(generator(childContext))
        .description("example 1")
        .script({
          observe: [
            effect("it checks things", (context) => {
              assert.equal(context, 27)
            })
          ]
        }),
      example(generator(childContext))
        .description("example 2")
        .script({
          observe: [
            effect("it checks more things", (context) => {
              assert.equal(context, 27)
            })
          ]
        }),
    ]),
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

  assert.equal(childContext.calledInit, 2)
  assert.equal(childContext.calledTeardownWith, [ 27, 27 ])

  assert.equal(stringContext.calledInit, 2)
  assert.equal(stringContext.calledTeardownWith, [ "some string", "some string" ])

  assert.equal(numberContext.calledInit, 2)
  assert.equal(numberContext.calledTeardownWith, [ 14, 14 ])
})

class TestContext<T, I> implements Context<T, I> {
  calledInit: number = 0
  calledTeardownWith: Array<T> = []
  
  constructor(private initializer: (initial: I) => T | Promise<T>) { }

  async init(initialValue: I): Promise<T> {
    this.calledInit++
    return this.initializer(initialValue)
  }

  async teardown(contextValue: T): Promise<void> {
    this.calledTeardownWith.push(contextValue)
  }
}

test.run()