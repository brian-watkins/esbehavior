import { Failure } from "./Reporter.js"
import { addInvalid, addSkipped, addValid, combineSummaries, emptySummary, Summary } from "./Summary.js"
import { Timer } from "./Timer.js"
import { waitFor } from "./waitFor.js"

export interface Claim<T> {
  description: string
  validate(context: T): Promise<ClaimResult>
  skip(): ClaimResult
}

export class SimpleClaim<T> implements Claim<T> {
  constructor(public description: string, private execute: (context: T) => void | Promise<void>, private timer: Timer) {}
  
  async validate(context: T): Promise<ClaimResult> {
    let claimResult: ClaimResult

    this.timer.start()

    try {
      await waitFor(this.execute(context))
      claimResult = validClaim(this.description)
    } catch (failure: any) {  
      claimResult = invalidClaim(this.description, failure)
    } 

    this.timer.stop()

    claimResult.durationInMillis = this.timer.durationInMillis()

    return claimResult
  }

  skip(): ClaimResult {
    return skippedClaim(this.description)
  }
}

export abstract class ComplexClaim<T> implements Claim<T> {
  constructor(public description: string, private claims: Array<Claim<T>>) {}

  abstract evaluateSubsumedClaim(claim: Claim<T>, context: T): Promise<ClaimResult>

  async validate(context: T): Promise<ClaimResult> {
    let result: ClaimResult = validClaim(this.description)

    for (const claim of this.claims) {
      const claimResult = await this.evaluateSubsumedClaim(claim, context)
      result = subsume(result, claimResult)
    }

    return result
  }

  skip(): ClaimResult {
    let result: ClaimResult = skippedClaim(this.description)

    for (const claim of this.claims) {
      result = subsume(result, claim.skip())
    }

    return result
  }
}

export interface ValidClaim {
  type: "valid-claim"
  description: string
  durationInMillis?: number
  subsumedResults: Array<ClaimResult>
}

export function validClaim(description: string): ValidClaim {
  return {
    type: "valid-claim",
    description,
    subsumedResults: []
  }
}

export interface SkippedClaim {
  type: "skipped-claim"
  description: string
  durationInMillis?: number
  subsumedResults: Array<ClaimResult>
}

export function skippedClaim(description: string): SkippedClaim {
  return {
    type: "skipped-claim",
    description,
    subsumedResults: []
  }
}

export interface InvalidClaim {
  type: "invalid-claim"
  description: string
  durationInMillis?: number
  error: Failure
  subsumedResults: Array<ClaimResult>
}

export function invalidClaim(description: string, error: Failure): InvalidClaim {
  return {
    type: "invalid-claim",
    description,
    error,
    subsumedResults: []
  }
}

export type ClaimResult = ValidClaim | InvalidClaim | SkippedClaim

function subsume(parent: ClaimResult, child: ClaimResult): ClaimResult {
  switch (child.type) {
    case "valid-claim":
    case "skipped-claim":
      parent.subsumedResults.push(child)
      return parent
    case "invalid-claim":
      const result = invalidClaim(parent.description, { message: "One or more claims are invalid" })
      result.subsumedResults = parent.subsumedResults
      result.subsumedResults.push(child)
      return result
  }
}

export function summarize(result: ClaimResult): Summary {
  if (result.subsumedResults.length > 0) {
    return result.subsumedResults
      .map(result => summarize(result))
      .reduce(combineSummaries, emptySummary())
  } else {
    switch (result.type) {
      case "valid-claim": return addValid(emptySummary())
      case "invalid-claim": return addInvalid(emptySummary())
      case "skipped-claim": return addSkipped(emptySummary())
    }
  }
}
