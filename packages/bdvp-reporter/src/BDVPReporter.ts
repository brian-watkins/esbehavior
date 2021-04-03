import { Transform, TransformCallback } from "stream";

export class BDVPReporter extends Transform {
  constructor() {
    super()
  }

  _transform(chunk: any, encoding: string, push: TransformCallback) {
    push(null, chunk.toString())
  }
}