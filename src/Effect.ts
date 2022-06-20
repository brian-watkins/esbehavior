import { SimpleClaim, ComplexClaim } from "./Claim.js";

export type Observable<T> = Effect<T> | Outcome<T>

export class Effect<T> extends SimpleClaim<T> {}

export class Outcome<T> extends ComplexClaim<T> {}