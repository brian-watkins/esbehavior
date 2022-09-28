import { OrderProvider } from "../../src/OrderProvider.js";

export class FakeOrderProvider implements OrderProvider {
  public description = "Fake Order Provider!"
  
  constructor(private orderedIndices: Array<number>) {}

  order<T>(items: T[]): T[] {
    let shuffled: Array<T> = []

    for (let i = 0; i < items.length; i++) {
      if (i < this.orderedIndices.length) {
        shuffled[i] = items[this.orderedIndices[i]]
      } else {
        shuffled[i] = items[i]
      }
    }

    return shuffled
  }
}