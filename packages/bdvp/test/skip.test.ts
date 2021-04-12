import { expect } from 'chai'
import { test } from 'uvu'
import { document, runDocs, skip, context, fact, example } from '../src/index'
import { docReport, FakeReporter, scenarioReport, skippedCondition, skippedObservation, validObservation } from './helpers/FakeReporter'

test("it skips a scenario", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("something", [
      skip.example("not important", context(() => {
        throw new Error("BAD GIVEN!!")
      }))
        .conditions([
          fact("it does something bad", () => {
            throw new Error("BAD WHEN!!")
          })
        ])
        .observations([
          fact("will never run this", () => {
            expect(7).to.equal(5)
          }),
          fact("or this", () => {
            expect(9).to.equal(1)
          })
        ]),
      example("important")
        .observations([
          fact("will run this", () => {
            expect(7).to.equal(7)
          })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("something", [
      scenarioReport("not important", [
        skippedCondition("it does something bad")
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