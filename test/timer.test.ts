import { suite } from "uvu"
import * as assert from "uvu/assert"
import { TimerFactory } from "../src/Timer.js"
import FakeTimers from "@sinonjs/fake-timers"
import { FakePerformance } from "./helpers/FakePerformance.js"

const timerTest = suite()

timerTest.before((context) => {
  context.clock = FakeTimers.install({
    now: new Date(2022, 9, 31, 8, 15, 23)
  })

  if (typeof window !== "undefined") {
    context.fakePerf = new FakePerformance()
    window.performance.mark = context.fakePerf.mark.bind(context.fakePerf)
    window.performance.measure = context.fakePerf.measure.bind(context.fakePerf)
  }
})

timerTest.before.each(context => {
  context.clock.reset()

  if (typeof window !== "undefined") {
    context.fakePerf.reset()
  }
})

timerTest.after((context) => {
  context.clock.uninstall()
})

timerTest("using multiple timers", (context) => {
  const timer1 = TimerFactory.newTimer()
  const timer2 = TimerFactory.newTimer()
  const timer3 = TimerFactory.newTimer()

  timer1.start()

  context.clock.tick(100)

  timer2.start()
  context.clock.tick(50)
  timer2.stop()
  context.clock.tick(100)

  timer3.start()
  context.clock.tick(75)
  timer3.stop()
  context.clock.tick(130)

  timer1.stop()

  assert.equal(timer1.durationInMillis(), 455)
  assert.equal(timer2.durationInMillis(), 50)
  assert.equal(timer3.durationInMillis(), 75)
})

timerTest.run()