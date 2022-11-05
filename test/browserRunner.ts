import { createServer } from "vite"
import { chromium } from "playwright"

const server = await createServer({
  configFile: false,
  server: {
    port: 5957,
  },
  logLevel: "warn"
})
await server.listen()

const browser = await chromium.launch({
  headless: true
})

const page = await browser.newPage()
page.on("console", (message) => {
  if (message.text().startsWith("[vite] connect")) return
  process.stdout.write(message.text())
})
page.on("pageerror", (message) => {
  process.stdout.write(JSON.stringify(message))
})

await page.goto("http://localhost:5957/test/index.html")

if (!process.env["WATCH"]) {
  await new Promise(resolve => setTimeout(resolve, 500))

  await browser.close()
  await server.close()
}

