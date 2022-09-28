import seedrandom from "seedrandom"

export interface OrderProvider {
  description: string
  order<T>(items: Array<T>): Array<T>
}

export class DefaultOrderProvider implements OrderProvider {
  public description = "Default ordering"

  order<T>(items: T[]): T[] {
    return items
  }
}

export class SeededRandomizer implements OrderProvider {
  private generator: seedrandom.PRNG
  public seed: string

  constructor (seed?: string) {
    this.seed = seed ? seed : Math.random().toString(32).substring(2).toUpperCase()
    this.generator = seedrandom(this.seed)
  }

  get description(): string {
    return `Randomized ordering with seed: ${this.seed}`
  }

  order<T>(items: Array<T>): Array<T> {
    let randomItems: Array<T> = items.slice()

    if (randomItems.length == 2) {
      if (this.generator() > 0.5) return randomItems
    }

    let remainingSize = randomItems.length
    while (remainingSize > 0) {
      remainingSize = remainingSize - 1
      const randomIndex = Math.floor(this.generator() * remainingSize)
      const randomItem = randomItems[randomIndex]
      const item = randomItems[remainingSize]
      randomItems[remainingSize] = randomItem
      randomItems[randomIndex] = item  
    }

    return randomItems;
  }
}
