import { Claim } from "./Claim.js";

export class Effect<T> extends Claim<T> {
  private type: "Effect" = "Effect"
}