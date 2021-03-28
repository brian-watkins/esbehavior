export async function waitFor<S>(waitable: S | Promise<S>): Promise<S> {
  if (waitable instanceof Promise) {
    return await waitable
  } else {
    return waitable
  }
}