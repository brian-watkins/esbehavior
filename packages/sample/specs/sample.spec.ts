import proclaim from 'proclaim'
import { document, it, runDocs, scenario, skip } from 'bdvp'

const spec = document("a sample spec", [
  scenario("comparing some numbers")
    .given(() => 7)
    .when("something happens", () => {})
    .when("something else happens", () => {})
    .observeThat([
      it("compares two numbers", (actual) => {
        proclaim.equal(actual, 7)
      }),
      it("does something that fails", (actual) => {
        proclaim.equal(actual, 8)
      })
    ]),
  skip.scenario("some boring scenario")
    .given(() => {})
    .observeThat([
      it("never runs this", () => {
        proclaim.equal(7, 5)
      })
    ])
])

runDocs([spec])