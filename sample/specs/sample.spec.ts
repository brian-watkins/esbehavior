import { expect } from 'chai'
import { describe, it, runDocs, scenario } from '../../src/index'

const spec = describe("a sample spec", [
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