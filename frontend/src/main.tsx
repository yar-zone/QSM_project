import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/hooks/use-auth'
import { routeTree } from './routeTree.gen'
import './styles.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const queryClient = new QueryClient()

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
