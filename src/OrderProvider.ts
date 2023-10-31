import { RandomGenerator, unsafeUniformIntDistribution, xoroshiro128plus } from "pure-rand"

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
  private generator: RandomGenerator
  private _seed: number

  constructor (seed?: string) {
    this._seed = seed ? this.toNumericSeed(seed) : this.generateNumericSeed();
    this.generator = xoroshiro128plus(this._seed)
  }

  private generateNumericSeed(): number {
    return Date.now() ^ (Math.random() * 0x100000000)
  }

  private toNumericSeed(seed: string): number {
    if (seed[0] === 'X') {
      return parseInt(seed.substring(1), 32) * -1
    } else {
      return parseInt(seed.substring(1), 32)
    }
  }

  get seed(): string {
    if (this._seed < 0) {
      return `X${this._seed.toString(32).substring(1).toUpperCase()}`
    } else {
      return `Y${this._seed.toString(32).toUpperCase()}`
    }
  }

  get description(): string {
    return `Randomized ordering with seed: ${this.seed}`
  }

  private nextValue(min: number, max: number): number {
    return unsafeUniformIntDistribution(min, max, this.generator)
  }

  order<T>(items: Array<T>): Array<T> {
    let randomItems: Array<T> = items.slice()

    // Fisher-Yates Suffle
    for (let i = 0; i < randomItems.length; i++) {
      const randomIndex = this.nextValue(i, randomItems.length - 1)
      const randomItem = randomItems[randomIndex]
      const current = randomItems[i]
      randomItems[i] = randomItem
      randomItems[randomIndex] = current
    }

    return randomItems;
  }
}
