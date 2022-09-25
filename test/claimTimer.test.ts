import { test } from "uvu";
import * as assert from 'uvu/assert'
import { Claim, Effect, Fact, Step } from "../src/index.js";
import { FakeTimer } from "./helpers/FakeTimer.js";

interface Generators {
  validClaim: (timer: FakeTimer) => Claim<void>
  invalidClaim: (timer: FakeTimer) => Claim<void>
}

const simpleClaimTimerBehavior = (name: string, generators: Generators) => {
  test(`timing a valid ${name}`, async () => {
    const fakeTimer = new FakeTimer(27)
    const claim = generators.validClaim(fakeTimer)
    const result = await claim.validate()
  
    assert.equal(result.duration, 27)
  })

  test(`timing an invalid ${name}`, async () => {
    const fakeTimer = new FakeTimer(35)
    const effect = generators.invalidClaim(fakeTimer)
    const result = await effect.validate()
  
    assert.equal(result.duration, 35)
  })  
}

const validAction = () => {}

const invalidAction = () => {
  throw {
    operator: "equals",
    expected: "something",
    actual: "nothing"
  }
}

simpleClaimTimerBehavior("fact", {
  validClaim: (timer) => new Fact("effect", validAction, timer),
  invalidClaim: (timer) => new Fact("effect", invalidAction, timer)
})

simpleClaimTimerBehavior("step", {
  validClaim: (timer) => new Step("effect", validAction, timer),
  invalidClaim: (timer) => new Step("effect", invalidAction, timer)
})

simpleClaimTimerBehavior("effect", {
  validClaim: (timer) => new Effect("effect", validAction, timer),
  invalidClaim: (timer) => new Effect("effect", invalidAction, timer)
})

test.run()