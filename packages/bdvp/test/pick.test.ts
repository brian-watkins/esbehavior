import { expect } from 'chai'
import { test } from 'uvu'
import { document, runDocs, pick, context, example, fact } from '../src/index'
import { docReport, FakeReporter, scenarioReport, skippedCondition, skippedObservation, validObservation } from './helpers/FakeReporter'

test("it only runs the picked scenario", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("something", [
      example("not important", context(() => {
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
      pick.example("important")
        .observations([
          fact("will run this", () => {
            expect(7).to.equal(7)
          })
        ])
    ]),
    document("another", [
      example("should be skipped", context(() => {
        throw new Error("BAD SO BAD")
      }))
        .conditions([
          fact("it does something that it shouldn't", () => {
            throw new Error("BAD!")
          })
        ])
        .observations([
          fact("just won't", () => {
            expect(7).to.equal(4)
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
    ]),
    docReport("another", [
      scenarioReport("should be skipped", [
        skippedCondition("it does something that it shouldn't")
      ], [
        skippedObservation("just won't")
      ])
    ])
  ], "it only runs the picked scenario")
})

test.run()