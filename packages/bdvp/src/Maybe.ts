export interface MaybeHandler<T,S> {
  nothing(): S
  something(item: T): S
}

export class Nothing<T> {
  public type = "Nothing"
  on<S>(handler: MaybeHandler<T,S>): S {
    return handler.nothing()
  }
}

export class Something<T> {
  public type = "Something"
  
  constructor (public value: T) {}

  on<S>(handler: MaybeHandler<T,S>): S {
    return handler.something(this.value)
  }
}

export type Maybe<T>
  = Nothing<T>
  | Something<T>

export function firstOf<T>(list: Array<T>): Maybe<T> {
  if (list.length === 0) {
    return new Nothing()
  }

  return new Something(list[0])
}
