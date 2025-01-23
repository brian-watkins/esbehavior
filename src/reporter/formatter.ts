export interface Formatter {
  underline(message: string): string
  bold(message: string): string
  dim(message: string): string
  red(message: string): string
  yellow(message: string): string
  green(message: string): string
  cyan(message: string): string
}

export class ANSIFormatter implements Formatter {
  private isDisabled = false

  constructor() {
    const noColor = getEnvironmentVariable("NO_COLOR")
    this.isDisabled = noColor !== undefined && noColor !== ""
  }

  private wrap(start: string, end: string, message: string): string {
    if (this.isDisabled) {
      return message
    }

    return start + message + end
  }

  private wrapColor(code: string, message: string): string {
    return this.wrap("\x1b[" + code + "m", "\x1b[39m", message)
  }

  underline(message: string): string {
    return this.wrap("\x1b[4m", "\x1b[24m", message)
  }

  bold(message: string): string {
    return this.wrap("\x1b[1m", "\x1b[22m", message)
  }

  dim(message: string): string {
    return this.wrap("\x1b[2m", "\x1b[22m", message)
  }

  red(message: string): string {
    return this.wrapColor("31", message)
  }

  yellow(message: string): string {
    return this.wrapColor("33", message)
  }

  green(message: string): string {
    return this.wrapColor("32", message)
  }

  cyan(message: string): string {
    return this.wrapColor("36", message)
  }
}

function getEnvironmentVariable(name: string): string | undefined {
  if (typeof process === "undefined") {
    return undefined
  }

  return process.env[name]
}