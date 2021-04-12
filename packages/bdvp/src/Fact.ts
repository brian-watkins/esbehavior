import { ScenarioStep } from "./ScenarioStep";

export class Fact<T> implements ScenarioStep<T> {
  constructor(public description: string, public run: (context: T) => void | Promise<void>) {}
}