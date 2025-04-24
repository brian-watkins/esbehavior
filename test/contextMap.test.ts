import { test } from "uvu";
import * as assert from 'uvu/assert'
import { behavior, Context, contextMap, defaultOrder, effect, example, use, validate } from "../src";
import { FakeReporter, withBehavior, withExample, withValidClaim } from "./helpers/FakeReporter";

test("context map with multiple independent contexts", async () => {
  const reporter = new FakeReporter()
  const stringContext = new TestContext(() => "some string")
  const numberContext = new TestContext(() => 14)

  const dependenciesContext = contextMap({
    someString: stringContext,
    someNumber: numberContext
  })

  let childContext = new TestContext((initial: { someString: string, someNumber: number }) => {
    return initial.someString.length + initial.someNumber + 2
  })

  await validate([
    behavior("my behavior with a context", [
      example(use(dependenciesContext, childContext))
        .description("example 1")
        .script({
          observe: [
            effect("it checks things", (context) => {
              assert.equal(context, 27)
            })
          ]
        }),
      example(use(dependenciesContext, childContext))
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
  assert.equal(childContext.calledTeardownWith, [27, 27])

  assert.equal(stringContext.calledInit, 2)
  assert.equal(stringContext.calledTeardownWith, ["some string", "some string"])

  assert.equal(numberContext.calledInit, 2)
  assert.equal(numberContext.calledTeardownWith, [14, 14])
})

test("context map with one context that depends on a previously added one", async () => {
  const reporter = new FakeReporter()
  const stringContext = new TestContext(() => "some string")
  let numberContext!: TestContext<number, void>

  const dependenciesContext = contextMap()
    .thenSet("someString", () => stringContext)
    .thenSet("someNumber", ({ someString }) => {
      if (numberContext === undefined) {
        numberContext = new TestContext(() => someString.length)
      }
      
      return numberContext
    })

  let childContext = new TestContext((initial: { someString: string, someNumber: number }) => {
    return initial.someString.length + initial.someNumber + 2
  })

  await validate([
    behavior("my behavior with a context", [
      example(use(dependenciesContext, childContext))
        .description("example 1")
        .script({
          observe: [
            effect("it checks things", (context) => {
              assert.equal(context, 24)
            })
          ]
        }),
      example(use(dependenciesContext, childContext))
        .description("example 2")
        .script({
          observe: [
            effect("it checks more things", (context) => {
              assert.equal(context, 24)
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
  assert.equal(childContext.calledTeardownWith, [24, 24])

  assert.equal(stringContext.calledInit, 2)
  assert.equal(stringContext.calledTeardownWith, ["some string", "some string"])

  assert.equal(numberContext.calledInit, 2)
  assert.equal(numberContext.calledTeardownWith, [11, 11])
})

test("context map with context that depends on an initial context", async () => {
  const reporter = new FakeReporter()
  const stringContext = new TestContext(() => "some string")
  let numberContext!: TestContext<number, void>

  const dependenciesContext = contextMap({ basis: stringContext })
    .thenSet("someNumber", ({ basis }) => {
      if (numberContext === undefined) {
        numberContext = new TestContext(() => basis.length)
      }
      
      return numberContext
    })

  let childContext = new TestContext((initial: { basis: string, someNumber: number }) => {
    return initial.basis.length + initial.someNumber + 2
  })

  await validate([
    behavior("my behavior with a context", [
      example(use(dependenciesContext, childContext))
        .description("example 1")
        .script({
          observe: [
            effect("it checks things", (context) => {
              assert.equal(context, 24)
            })
          ]
        }),
      example(use(dependenciesContext, childContext))
        .description("example 2")
        .script({
          observe: [
            effect("it checks more things", (context) => {
              assert.equal(context, 24)
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
  assert.equal(childContext.calledTeardownWith, [24, 24])

  assert.equal(stringContext.calledInit, 2)
  assert.equal(stringContext.calledTeardownWith, ["some string", "some string"])

  assert.equal(numberContext.calledInit, 2)
  assert.equal(numberContext.calledTeardownWith, [11, 11])
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