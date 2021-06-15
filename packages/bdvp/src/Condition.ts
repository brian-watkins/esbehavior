import { Claim } from "./Claim.js";

export class Condition<T> extends Claim<T> {
  private type: "Condition" = "Condition"
}