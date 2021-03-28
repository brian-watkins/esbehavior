import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { document, scenario, it, runDocs } from '../src/index'
import { FakeReporter } from './helpers/FakeReporter'
import { expect } from 'chai'

test("it runs multiple describes", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("a single test", [
      scenario("just a test")
        .given(() => 7)
        .observeThat([
          it("compares the correct number", (actual) => {
            expect(actual).to.equal(7)
          })
        ])
    ]),
    document("another test", [
      scenario("just another test")
        .given(() => 18)
        .observeThat([
          it("compares another correct number", (actual) => {
            expect(actual).to.equal(18)
          })
        ])
    ])
  ], { reporter })

  assert.equal(reporter.logLines, [
    "TAP version 13",
    "# a single test",
    "# just a test",
    "ok it compares the correct number",
    "# another test",
    "# just another test",
    "ok it compares another correct number",
    "1..2"
  ], "it prints the expected output for multiple describes")
})

test.run()