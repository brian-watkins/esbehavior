import * as stackTraceParser from 'stacktrace-parser';
import { Condition, Step } from './Assumption';
import { Observable } from './Effect';

export interface Script<T> {
  prepare?: Array<Condition<T>>
  perform?: Array<Step<T>>
  observe?: Array<Observable<T>>
}

export interface ScriptContext<T> {
  location: string
  script: Script<T>
}

export function scriptContext<T>(script: Script<T>): ScriptContext<T> {
  return {
    location: scriptLocation(),
    script
  }
}

function scriptLocation(): string {
  try {
    const error = new Error()
    const frame = stackTraceParser.parse(error.stack!)[3]
    return `${frame.file}:${frame.lineNumber}:${frame.column}`
  } catch (err) {
    return "Unknown script location"
  }
}
