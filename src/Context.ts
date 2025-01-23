import { waitFor } from "./waitFor.js"

export interface Context<T, Initial = void> {
  init: (initialValue: Initial) => T | Promise<T>
  teardown?: (context: T) => void | Promise<void>
}

export class BehaviorContext<T> implements Context<void> {
  private contextValue: T | undefined

  constructor(private context: Context<T>) { }

  async init(): Promise<void> { }

  useWithContext<S>(context: Context<S, T>): Context<S> {
    return {
      init: async () => {
        if (this.contextValue === undefined) {
          this.contextValue = await waitFor(this.context.init())
        }
        return context.init(this.contextValue)
      },
      teardown: async (exampleContextValue) => {
        await waitFor(context.teardown?.(exampleContextValue))
      }
    }
  }

  teardown(): void | Promise<void> {
    if (this.contextValue !== undefined) {
      this.context.teardown?.(this.contextValue)
    }
  }
}