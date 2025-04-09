export interface Context<T, Initial = void> {
  init: (initialValue: Initial) => T | Promise<T>
  teardown?: (context: T) => void | Promise<void>
}

export type ExtractContextTypes<C> = C extends Context<infer T, infer I> ? { value: T; init: I } : never;

export type ContextValues<T extends Record<string, Context<any>>> = {
  [K in keyof T]: ExtractContextTypes<T[K]>['value'];
};

export function contextMap<T extends Record<string, Context<any>>>(base: T = {} as T): ContextMap<ContextValues<T>> {
  return new InnerContextMap(join(base))
}

export interface ContextMap<T> extends Context<T> {
  set<S, N extends string>(name: N, generator: (dependencies: T) => Context<S, void>): ContextMap<T & Record<N, S>>
}

class InnerContextMap<T extends Record<string, any>> implements Context<T> {
  constructor(private dependencyContext: Context<T>) { }

  init(): T | Promise<T> {
    return this.dependencyContext.init()
  }

  teardown(context: T): void | Promise<void> {
    return this.dependencyContext.teardown?.(context)
  }

  set<S, N extends string>(name: N, generator: (dependencies: T) => Context<S, void>): ContextMap<T & Record<N, S>> {
    let context: Context<S>
    const wrapperContext: Context<T & Record<N, S>> = {
      init: async () => {
        const deps = await this.dependencyContext.init()
        context = generator(deps)
        const val = await context.init()
        return { ...deps, [name]: val }
      },
      teardown: async (valueMap) => {
        await context.teardown?.(valueMap[name])
        return this.dependencyContext.teardown?.(valueMap)
      }
    }

    return new InnerContextMap(wrapperContext)
  }
}

function join<T extends Record<string, Context<any>>>(contexts: T): Context<ContextValues<T>> {
  const context: Context<ContextValues<T>> = {
    init: async () => {
      let dependencyValues: ContextValues<T> = {} as ContextValues<T>
      for (const key in contexts) {
        dependencyValues[key] = await contexts[key].init()
      }
      return dependencyValues
    },
    teardown: async (values) => {
      for (const key in contexts) {
        await contexts[key].teardown?.(values[key])
      }
    }
  }

  return context
}

export function use<T, S>(context: Context<T>, dependentContext: Context<S, T>): Context<S> {
  let contextVal: T

  return {
    init: async () => {
      contextVal = await context.init()
      return dependentContext.init(contextVal)
    },
    async teardown(val) {
      await context.teardown?.(contextVal)
      return dependentContext.teardown?.(val)
    }
  }
}




// Behavior Contexts

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