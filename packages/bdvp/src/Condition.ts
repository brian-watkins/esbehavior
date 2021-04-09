import { ScenarioStep } from "./ScenarioStep";

export class Condition<T> implements ScenarioStep<T> {
  public description: string

  constructor(name: string, public run: (context: T) => void | Promise<void>) {
    this.description = `when ${name}`
  }
}