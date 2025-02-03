import { test } from "uvu";
import * as assert from 'uvu/assert'
import { Context, useWithContext } from "../src";

test("context generator with contexts", async () => {
  const stringContext = new TestContext(() => "some string")
  const numberContext = new TestContext(() => 14)

  const generator = useWithContext({
    someString: stringContext,
    someNumber: numberContext
  })

  let childContext = new TestContext((initial: { someString: string, someNumber: number }) => {
    return initial.someString.length + initial.someNumber + 2
  })

  const myContext = generator(childContext)

  const contextValue = await myContext.init()
  await myContext.teardown?.(contextValue)

  const contextValue2 = await myContext.init()
  await myContext.teardown?.(contextValue2)

  assert.equal(contextValue, 27)
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