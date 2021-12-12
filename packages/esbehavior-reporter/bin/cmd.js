#!/usr/bin/env node

import { BehaviorReporter } from "../dist/BehaviorReporter.js"
import process from "process"

const reporter = new BehaviorReporter()

process.stdin
  .pipe(reporter)
  .pipe(process.stdout)
