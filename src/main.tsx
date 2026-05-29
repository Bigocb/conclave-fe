import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PulseProvider } from './hooks/usePulse'
import App from './App'

const queryClient = new QueryClient()

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <PulseProvider>
        <App />
      </PulseProvider>
    </QueryClientProvider>
  )
}
