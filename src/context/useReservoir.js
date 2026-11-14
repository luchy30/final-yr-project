import { createContext, useContext } from 'react'

export const ReservoirContext = createContext(null)

export function useReservoir() {
  const context = useContext(ReservoirContext)
  if (!context) {
    throw new Error('useReservoir must be used within a ReservoirProvider')
  }
  return context
}
