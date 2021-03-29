import { expect } from 'chai'
import { test } from 'uvu'
import { document, scenario, it, runDocs, skip } from '../src/index'
import { actionReport, docReport, FakeReporter, scenarioReport, skippedObservation, validObservation } from './helpers/FakeReporter'

test("it skips a scenario", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("something", [
      skip.scenario("not important")
        .given(() => {
          throw new Error("BAD GIVEN!!")
        })
        .when("it does something bad", () => {
          throw new Error("BAD WHEN!!")
        })
        .observeThat([
          it("will never run this", () => {
            expect(7).to.equal(5)
          }),
          it("or this", () => {
            expect(9).to.equal(1)
          })
        ]),
      scenario("important")
        .given(() => {})
        .observeThat([
          it("will run this", () => {
            expect(7).to.equal(7)
          })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("something", [
      scenarioReport("not important", [
        actionReport("it does something bad")
      ], [
        skippedObservation("will never run this"),
        skippedObservation("or this")
      ]),
      scenarioReport("important", [], [
        validObservation("will run this")
      ])
    ])
  ], "it skips all observations when a scenario is skipped")
})

test.run()