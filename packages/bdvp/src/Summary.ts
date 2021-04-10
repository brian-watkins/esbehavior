
export interface Summary {
  valid: number
  invalid: number
  skipped: number
}

export function emptySummary(): Summary {
  return { valid: 0, invalid: 0, skipped: 0 }
}

export function addValid(results: Summary): Summary {
  return { ...results, valid: results.valid + 1 }
}

export function addInvalid(results: Summary): Summary {
  return { ...results, invalid: results.invalid + 1 }
}

export function addSkipped(results: Summary): Summary {
  return { ...results, skipped: results.skipped + 1 }
}

export function addSummary(current: Summary, next: Summary): Summary {
  return {
    valid: current.valid + next.valid,
    invalid: current.invalid + next.invalid,
    skipped: current.skipped + next.skipped
  }
}