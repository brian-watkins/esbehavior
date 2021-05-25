#!/usr/bin/env node

import { BDVPReporter } from "../dist/BDVPReporter.js"
import process from "process"

const reporter = new BDVPReporter()

process.stdin
  .pipe(reporter)
  .pipe(process.stdout)
