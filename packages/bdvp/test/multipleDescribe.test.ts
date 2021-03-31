import { test } from 'uvu'
import { document, scenario, it, runDocs } from '../src/index'
import { docReport, FakeReporter, scenarioReport, validObservation } from './helpers/FakeReporter'
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

  reporter.expectTestReportWith([
    docReport("a single test", [
      scenarioReport("just a test", [], [
        validObservation("compares the correct number")
      ])
    ]),
    docReport("another test", [
      scenarioReport("just another test", [], [
        validObservation("compares another correct number")
      ])
    ])
  ], "it prints the expected output for multiple describes")
})

test.run()