#!/usr/bin/env node

import { chromium } from 'playwright'
import { createServer } from 'vite'

const mode = process.env["MODE"]
const port = 9999

// Serve Test Files

const server = await createServer({
  configFile: './specs/vite.config.js',
  server: {
    port
  }
})
await server.listen()


// Run Test Files

const browser = await chromium.launch({
  headless: mode !== "debug"
})
const page = await browser.newPage()

page.on("console", console.log)
page.on("pageerror", console.log)

await page.goto(`http://localhost:${port}/index.html`)
await page.evaluate("bdvp_run()")

if (mode === "watch" || mode === "debug") {
  page.on("load", (page) => {
    page.evaluate("bdvp_run()")
  })
} else {
  await browser.close()
  await server.close()
}