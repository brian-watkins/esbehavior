import { ScenarioStep } from "./ScenarioStep"

export class Observation<T> implements ScenarioStep<T> {
  public description: string

  constructor(name: string, public run: (context: T) => void | Promise<void>) {
    this.description = `it ${name}`
  }
}