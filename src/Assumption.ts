import { SimpleClaim } from "./Claim.js";

export type Assumption<T> = Condition<T> | Step<T>

export class Condition<T> extends SimpleClaim<T> {}

export class Step<T> extends SimpleClaim<T> {}