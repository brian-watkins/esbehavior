import { Claim } from "./Claim";

export class Effect<T> implements Claim<T> {
  private type: "Effect" = "Effect"

  constructor(public description: string, public validate: (context: T) => void | Promise<void>) {}
}