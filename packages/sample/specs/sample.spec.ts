import proclaim from 'proclaim'
import { context, document, it, runDocs, scenario, skip } from 'bdvp'

const spec = document("a sample spec", [
  scenario("comparing some numbers", context(() => 7))
    .when("something happens", () => {})
    .when("something else happens", () => {})
    .observeThat([
      it("compares two numbers", (context) => {
        proclaim.equal(context, 7)
      }),
      it("does something that fails", (context) => {
        proclaim.equal(context, 8)
      })
    ]),
  skip.scenario("some boring scenario")
    .observeThat([
      it("never runs this", () => {
        proclaim.equal(7, 5)
      })
    ])
])

runDocs([spec])