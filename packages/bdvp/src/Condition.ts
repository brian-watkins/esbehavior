import { Claim } from "./Claim.js";

export class Condition<T> implements Claim<T> {
  private type: "Condition" = "Condition"

  constructor(public description: string, public validate: (context: T) => void | Promise<void>) {}
}