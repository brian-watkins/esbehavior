import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { describe, scenario, it } from '../src/index'
import { FakeReporter } from './FakeReporter'

test("it runs a single passing test", () => {
  const reporter = new FakeReporter()

  describe("a single test", [
    scenario("my first test")
      .given(() => { })
      .observeThat([
        it("does something cool", () => {
          // nothing
        })
      ])
  ], reporter)

  assert.equal(reporter.logLines, [
    "TAP version 13",
    "# a single test",
    "# my first test",
    "ok 1 it does something cool",
    "1..1"
  ], "it prints the expected output for a scenario with a single valid observation")
})

test("it runs more than one passing test", () => {
  const reporter = new FakeReporter()

  describe("a single test", [
    scenario("several observations")
      .given(() => { })
      .observeThat([
        it("does something cool", () => {
          // nothing
        }),
        it("does something else cool", () => {
          // nothing
        })
      ])
  ], reporter)

  assert.equal(reporter.logLines, [
    "TAP version 13",
    "# a single test",
    "# several observations",
    "ok 1 it does something cool",
    "ok 2 it does something else cool",
    "1..2"
  ], "it prints the expected output for a scenarion with multiple valid observations")
})

test("it runs a failing test", () => {
  const reporter = new FakeReporter()

  describe("a single test", [
    scenario("failing observation")
      .given(() => {})
      .observeThat([
        it("does something that fails", () => {
          const testFailure: any = new Error()
          testFailure.expected = "something"
          testFailure.actual = "nothing"
          testFailure.operator = "equals"
          testFailure.stack = "fake stack"
          throw testFailure
        }),
        it("passes", () => {})
      ])
  ], reporter)

  assert.equal(reporter.logLines, [
    "TAP version 13",
    "# a single test",
    "# failing observation",
    "not ok 1 it does something that fails",
    "  ---",
    "  operator: equals",
    "  expected: something",
    "  actual:   nothing",
    "  stack: |-",
    "    fake stack",
    "  ...",
    "ok 2 it passes",
    "1..2"
  ], "it prints the expected output for a scenario with an observation that throws an AssertionError")
})

test.run()