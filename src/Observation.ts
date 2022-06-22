import { SimpleClaim, ComplexClaim, Claim, ClaimResult } from "./Claim.js"
import { ScriptContext } from "./Script.js"

export type Observation<T> = Effect<T> | Outcome<T>

export class Effect<T> extends SimpleClaim<T> {}

export class Outcome<T> extends ComplexClaim<T> {
  evaluateSubsumedClaim(claim: Claim<T>, scriptContext: ScriptContext<T>, context: T): Promise<ClaimResult> {
    return claim.validate(scriptContext, context)
  }
}