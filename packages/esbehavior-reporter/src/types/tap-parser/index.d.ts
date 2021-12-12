declare module 'tap-parser' {
  import { Writable } from 'stream';
  
  export interface TapAssert {
    ok: boolean
    id: number
    name?: string
    todo?: string
    skip?: string | boolean
    diag?: any
  }

  export type TapComment = string

  export default class Parser extends Writable {
    constructor(onFinish?: (results: string) => void)
    on(name: "assert", handler: (value: TapAssert) => void)
    on(name: "comment", handler: (value: TapComment) => void)
  }
}