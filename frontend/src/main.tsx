import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/hooks/use-auth'
import { routeTree } from './routeTree.gen'
import './styles.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes — dashboard data doesn't change every second
      gcTime: 1000 * 60 * 5,    // keep cached data for 5 minutes
      retry: 1,                  // only retry once on failure
      refetchOnWindowFocus: false,
    },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>,
)
