import { Claim, ClaimResult, ComplexClaim, SimpleClaim } from "./Claim.js"

export type Action<T> = Procedure<T> | Step<T>

export class Step<T> extends SimpleClaim<T> {}

export class Procedure<T> extends ComplexClaim<T> {
  private shouldValidate = true

  async evaluateSubsumedClaim(claim: Claim<T>, context: T): Promise<ClaimResult> {
    if (this.shouldValidate) {
      const result = await claim.validate(context)
      result.when({
        valid: () => {},
        invalid: () => { this.shouldValidate = false },
        skipped: () => {}
      })
      return result
    } else {
      return claim.skip()
    }
  }
}
