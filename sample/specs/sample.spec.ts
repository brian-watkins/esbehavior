import { expect } from 'chai'
import { describe, it, scenario } from '../../src/index'

describe("a sample spec", [
  scenario("comparing some numbers")
    .given(() => 7)
    .observeThat([
      it("compares two numbers", (actual) => {
        expect(actual).to.equal(7)
      })
    ])
])