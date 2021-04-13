import { Claim } from "./Claim";

export class Condition<T> implements Claim<T> {
  constructor(public description: string, public validate: (context: T) => void | Promise<void>) {}
}