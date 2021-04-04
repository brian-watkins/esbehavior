#!/usr/bin/env node

const { BDVPReporter } = require("../dist/BDVPReporter")
const process = require("process")

const reporter = new BDVPReporter()

process.stdin
  .pipe(reporter)
  .pipe(process.stdout)
