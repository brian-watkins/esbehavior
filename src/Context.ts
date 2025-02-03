export interface Context<T, Initial = void> {
  init: (initialValue: Initial) => T | Promise<T>
  teardown?: (context: T) => void | Promise<void>
}

type ExtractContextTypes<C> = C extends Context<infer T, infer I> ? { value: T; init: I } : never;

type ContextValues<T> = {
  [K in keyof T]: ExtractContextTypes<T[K]>['value'];
};

export function contextGenerator<D extends Record<string, Context<any>>>(dependencies: D): <T>(ctx: Context<T, ContextValues<D>>) => Context<T> {
  let initialValue = {} as ContextValues<D>

  return (childContext) => {
    return {
      init: async () => {
        for (const dependency in dependencies) {
          initialValue[dependency] = await dependencies[dependency].init()
        }

        return childContext.init(initialValue)
      },
      teardown: async (value) => {
        for (const dependency in initialValue) {
          await dependencies[dependency].teardown?.(initialValue[dependency])
        }

        await childContext.teardown?.(value)
      }
    }
  }
}

interface CustomGlobalThis extends Global {
  __esbehaviorContexts: Array<() => Promise<void>>
}

declare let globalThis: CustomGlobalThis

globalThis.__esbehaviorContexts = []

export async function teardownBehaviorContexts(): Promise<void> {
  for (const teardown of globalThis.__esbehaviorContexts) {
    await teardown()
  }
  globalThis.__esbehaviorContexts = []
}

function addBehaviorContextTeardown(handler: () => Promise<void>) {
  globalThis.__esbehaviorContexts.push(handler)
}

export function behaviorContext<T>(context: Context<T>): Context<T> {
  let contextValue: T | undefined = undefined

  return {
    init: async () => {
      if (contextValue === undefined) {
        contextValue = await context.init()

        addBehaviorContextTeardown(async () => {
          await context.teardown?.(contextValue!)
          contextValue = undefined
        })
      }
      return contextValue!
    }
  }
}