import { expect } from 'chai'
import { document, it, runDocs, scenario } from '../../src/index'

const spec = document("a sample spec", [
  scenario("comparing some numbers")
    .given(() => 7)
    .observeThat([
      it("compares two numbers", (actual) => {
        expect(actual).to.equal(7)
      }),
      it("does something that fails", (actual) => {
        expect(actual).to.equal(8)
      })
    ])
])

runDocs([spec])