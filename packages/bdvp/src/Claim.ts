import { Failure } from "./Reporter.js"
import { waitFor } from "./waitFor.js"

export class Claim<T> {

  constructor(public description: string, public execute: (context: T) => void | Promise<void>) {}
  
  async validate(context: T): Promise<ClaimResult> {
    try {
      await waitFor(this.execute(context))
      return new ValidClaim()
    } catch (failure) {
      return new InvalidClaim(failure)
    }
  }
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