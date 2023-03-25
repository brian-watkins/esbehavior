import * as stackTraceParser from 'stacktrace-parser';
import { Action } from './Action.js';
import { Presupposition } from './Presupposition.js';
import { Observation } from './Observation.js';

export interface Script<T> {
  suppose?: Array<Presupposition<T>>
  perform?: Array<Action<T>>
  observe?: Array<Observation<T>>
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
