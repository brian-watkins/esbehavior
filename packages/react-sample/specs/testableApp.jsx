import React from 'react'
import { render, cleanup, screen } from '@testing-library/react'
import { expect } from 'chai'
import App from '../src/App'

export const testableApp = {
  subject: () => {
    render(<App />)
    return new Testable()
  },
  teardown: () => {
    cleanup()
  }
}

class Testable {
  expectTextOnPage(text) {
    expect(screen.getByText(text)).to.not.be.null
  }
}
