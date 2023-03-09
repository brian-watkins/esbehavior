import { Claim, ClaimResult, ComplexClaim, SimpleClaim } from "./Claim.js";

export type Presupposition<T> = Fact<T> | Situation<T>

export class Fact<T> extends SimpleClaim<T> {}

export class Situation<T> extends ComplexClaim<T> {
  private shouldValidate = true

  async evaluateSubsumedClaim(claim: Claim<T>, context: T): Promise<ClaimResult> {
    if (this.shouldValidate) {
      const result = await claim.validate(context)
      if (result.type === "invalid-claim") {
        this.shouldValidate = false
      }
      return result
    } else {
      return claim.skip()
    }
  }
}