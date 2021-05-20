#!/usr/bin/env node

import { createConfiguration, startServer, logger } from 'snowpack'
import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url';

const modulePath = path.dirname(fileURLToPath(import.meta.url));

const config = createConfiguration({
  root: path.join(modulePath, "specs"),
  workspaceRoot: path.join(modulePath, "..", ".."),
  packageOptions: {
    knownEntrypoints: [
      "proclaim",
      "bdvp"
    ]
  },
  devOptions: {
    port: 9999
  }
});

logger.level = "silent"

const server = await startServer({config})

const browser = await chromium.launch()
const page = await browser.newPage()

page.on("console", async (message) => {
  if (!process.env["WATCH_MODE"] && message.text() === "# DONE") {
    await server.shutdown()
    await browser.close()
  } else {
    console.log(message)
  }
})

if (process.env["WATCH_MODE"]) {
  server.onFileChange(async () => {
    await page.reload()
  })  
}

await page.goto("http://localhost:9999/index.html")
