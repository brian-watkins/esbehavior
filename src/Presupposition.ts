import { SimpleClaim } from "./Claim.js";

export type Presupposition<T> = Fact<T>

export class Fact<T> extends SimpleClaim<T> {}
