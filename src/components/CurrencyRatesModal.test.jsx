import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CurrencyRatesModal from './CurrencyRatesModal.jsx'

const currencyOptions = [
  { code: 'USD', label: 'USD ($)', fallbackUsdRate: 1 },
  { code: 'EUR', label: 'EUR (€)', fallbackUsdRate: 1.1 },
]

describe('CurrencyRatesModal', () => {
  it('validates positive numbers before submitting', async () => {
    const handleSubmit = vi.fn()
    render(
      <CurrencyRatesModal
        open
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        currencyOptions={currencyOptions}
        currentRates={{ USD: 1, EUR: 1.05 }}
      />
    )

    const eurInput = screen.getByLabelText('EUR (€)')
    fireEvent.change(eurInput, { target: { value: '-1' } })
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => {
      expect(handleSubmit).not.toHaveBeenCalled()
      expect(
        screen.getByText(/doit être un nombre positif/i)
      ).toBeInTheDocument()
    })
  })

  it('submits sanitized rates', async () => {
    const handleSubmit = vi.fn()
    render(
      <CurrencyRatesModal
        open
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        currencyOptions={currencyOptions}
        currentRates={{ USD: 1, EUR: 1.05 }}
      />
    )

    const eurInput = screen.getByLabelText('EUR (€)')
    fireEvent.change(eurInput, { target: { value: '1.234567' } })
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ EUR: 1.234567 })
    })
  })
})
