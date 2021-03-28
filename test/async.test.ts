import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { FakeReporter } from './helpers/FakeReporter'
import { describe, scenario, it, runDocs } from '../src/index'
import { expect } from 'chai'

test("it runs a scenario with an async given", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    describe("a single test", [
      scenario("async given")
        .given(() => {
          return new Promise(resolve => {
            setTimeout(() => resolve(7), 150)
          })
        })
        .observeThat([
          it("compares the right numbers", (actual) => {
            assert.equal(actual, 7, "it does the thing")
          })
        ])
    ])
  ], { reporter })

  assert.equal(reporter.logLines, [
    "TAP version 13",
    "# a single test",
    "# async given",
    "ok it compares the right numbers",
    "1..1"
  ], "it prints the expected output for a scenario with an async given")
})

test("it runs a scenario with an async given and async observation", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    describe("a single test", [
      scenario<number>("async given and observation")
        .given(() => {
          return new Promise(resolve => {
            setTimeout(() => resolve(7), 150)
          })
        })
        .observeThat([
          it("async compares the right numbers", async (actual) => {
            const fetchedValue = await new Promise(resolve => {
              setTimeout(() => resolve(actual + 5), 100)
            })
            try {
              expect(fetchedValue).to.equal(15)
            } catch (err) {
              err.stack = "fake stack"
              throw err
            }
          }),
          it("does something sync", (actual) => {
            assert.equal(actual, 7)
          })
        ])
    ])
  ], { reporter })

  assert.equal(reporter.logLines, [
    "TAP version 13",
    "# a single test",
    "# async given and observation",
    "not ok it async compares the right numbers",
    "  ---",
    "  operator: strictEqual",
    "  expected: 15",
    "  actual:   12",
    "  stack: |-",
    "    fake stack",
    "  ...",
    "ok it does something sync",
    "1..2"
  ], "it prints the expected output for a scenario with an async given and async observation")
})

test("it runs async when blocks", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    describe("a single test", [
      scenario<{ val: number }>("multiple when blocks")
        .given(() => ({ val: 7 }))
        .when("the value is incremented", (context) => { context.val++ })
        .when("the value is incremented asynchronously", (context) => {
          return new Promise(resolve => {
            setTimeout(() => {
              context.val++
              resolve()
            }, 150)
          })
        })
        .when("the value is incremented", (context) => { context.val++ })
        .observeThat([
          it("compares the correct number", (actual) => {
            expect(actual.val).to.equal(10)
          })
        ])
    ])
  ], { reporter })

  assert.equal(reporter.logLines, [
    "TAP version 13",
    "# a single test",
    "# multiple when blocks",
    "# when the value is incremented",
    "# when the value is incremented asynchronously",
    "# when the value is incremented",
    "ok it compares the correct number",
    "1..1"
  ], "it prints the expected output for a scenario with multiple when blocks")
})

test.run()