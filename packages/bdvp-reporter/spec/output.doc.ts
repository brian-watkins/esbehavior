import { document, context, fact, example } from 'bdvp'
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
  example("standard document with scenario and observations", context(() => new TestableApp()))
    .conditions([
      fact("a document is executed", async (testableApp) => {
        await testableApp.executeDoc(standardDocument)
      })
    ])  
    .observations([
      fact("the report includes the name of the document", (testableApp) => {
        expect.include(testableApp.output, "a sample spec")
      }),
      fact("the report includes the name of the example", (testableApp) => {
        expect.include(testableApp.output, "comparing some numbers")
      })
    ])

export default document("document report", [
  standardScenario
])