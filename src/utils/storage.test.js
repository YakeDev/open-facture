import { beforeEach, describe, expect, it } from 'vitest'
import { loadHistory, saveHistory } from './storage.js'

describe('storage utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns an empty array when nothing stored', () => {
    expect(loadHistory()).toEqual([])
  })

  it('recovers from corrupted JSON and clears the key', () => {
    localStorage.setItem('invoicesHistory', '{invalid: json')
    const result = loadHistory()
    expect(result).toEqual([])
    expect(localStorage.getItem('invoicesHistory')).toBeNull()
  })

  it('persists and retrieves history', () => {
    const history = [{ id: '1', number: 'Fact-0001' }]
    saveHistory(history)
    expect(loadHistory()).toEqual(history)
  })
})
