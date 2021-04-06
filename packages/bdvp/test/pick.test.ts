import { expect } from 'chai'
import { test } from 'uvu'
import { document, scenario, it, runDocs, pick, context } from '../src/index'
import { actionReport, docReport, FakeReporter, scenarioReport, skippedObservation, validObservation } from './helpers/FakeReporter'

test("it only runs the picked scenario", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("something", [
      scenario("not important", context(() => {
        throw new Error("BAD GIVEN!!")
      }))
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
      pick.scenario("important")
        .observeThat([
          it("will run this", () => {
            expect(7).to.equal(7)
          })
        ])
    ]),
    document("another", [
      scenario("should be skipped", context(() => {
        throw new Error("BAD SO BAD")
      }))
        .when("it does something that it shouldn't", () => {
          throw new Error("BAD!")
        })
        .observeThat([
          it("just won't", () => {
            expect(7).to.equal(4)
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
    ]),
    docReport("another", [
      scenarioReport("should be skipped", [
        actionReport("it does something that it shouldn't")
      ], [
        skippedObservation("just won't")
      ])
    ])
  ], "it only runs the picked scenario")
})

test.run()