import { Failure, Reporter, writeTestFailure, writeTestPass, writeTestSkip } from "./Reporter.js"
import { waitFor } from "./waitFor.js"

export interface Claim<T> {
  description: string
  validate(context: T): void | Promise<void>
}

export interface ClaimResultHandler<S> {
  valid(): S
  invalid(error: Failure): S
}

export class ValidClaim {
  public type = "Valid"

  on<S>(handler: ClaimResultHandler<S>): S {
    return handler.valid()
  }
}

export class InvalidClaim {
  public type = "Invalid"
  constructor (public error: Failure) {}

  on<S>(handler: ClaimResultHandler<S>): S {
    return handler.invalid(this.error)
  }
}

export type ClaimResult = ValidClaim | InvalidClaim

export async function validate<T>(claim: Claim<T>, context: T, reporter: Reporter): Promise<ClaimResult> {
  try {
    await waitFor(claim.validate(context))
    writeTestPass(reporter, claim.description)
    return new ValidClaim()
  } catch (error) {
    writeTestFailure(reporter, claim.description, error)
    return new InvalidClaim(error)
  }
}

export function ignore<T>(claim: Claim<T>, reporter: Reporter) {
  writeTestSkip(reporter, claim.description)
}