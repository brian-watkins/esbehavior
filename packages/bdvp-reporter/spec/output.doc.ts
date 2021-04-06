import { document, scenario, it, context } from 'bdvp'
import expect from 'proclaim'
import { TestableApp } from './TestableApp'

const standardDocument = `
TAP version 13
# a sample spec
# comparing some numbers
# when something happens
ok it compares two numbers
1..1
# valid observations: 1
# invalid observations: 0
# skipped: 0
`

const standardScenario =
  scenario("standard document with scenario and observations", context(() => new TestableApp()))
    .when("it handles a document", async (testableApp) => {
      await testableApp.executeDoc(standardDocument)
    })
    .observeThat([
      it("prints the name of the document", (testableApp) => {
        expect.include(testableApp.output, "a sample spec")
      }),
      it("prints the name of the scenario", (testableApp) => {
        expect.include(testableApp.output, "comparing some numbers")
      })
    ])

export default document("document report", [
  standardScenario
])