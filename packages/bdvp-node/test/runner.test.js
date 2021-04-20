const { test } = require('uvu')
const assert = require('uvu/assert')
const shell = require('shelljs')

test("running the sample document", async () => {
  const command = 
    "./bin/run" +
    " ./test/sample/specs/**/*.spec.ts" +
    " -r esbuild-register"
  
  const runnerOutput = shell.exec(command, { silent: true })
  assert.match(runnerOutput.stdout, /TAP version 13/)
  assert.match(runnerOutput.stdout, /# pass 1/)
})

test.run()