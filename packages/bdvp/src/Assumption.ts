import { Claim } from "./Claim.js";

export type Assumption<T> = Condition<T> | Step<T>

export class Condition<T> extends Claim<T> {
  private _type: "condition" = "condition"
}

export class Step<T> extends Claim<T> {
  private _type: "step" = "step"
}