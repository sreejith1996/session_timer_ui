import { useEffect, useState, type JSX } from 'react'
import { useNavigate } from 'react-router'

import { supabase } from '../lib/supabase'

export default function AuthCallbackPage(): JSX.Element {
  const [verifying, setVerifying] = useState<boolean>(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState<boolean>(false)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const handleAuthCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const code = searchParams.get('code')
      const accessToken = hashParams.get('access_token')
      const hashError = hashParams.get('error_description') ?? hashParams.get('error')

      try {
        if (hashError) {
          throw new Error(hashError)
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            throw error
          }
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (type as any) || 'email',
          })

          if (error) {
            throw error
          }
        } else if (!accessToken) {
          throw new Error('Authentication link is missing the expected credentials.')
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          throw new Error('Authentication succeeded, but no session was created.')
        }

        if (!isMounted) {
          return
        }

        setAuthSuccess(true)
        navigate('/', { replace: true })
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error ? error.message : 'Authentication failed.'

        setAuthError(message)
      } finally {
        if (isMounted) {
          setVerifying(false)
        }
      }
    }

    void handleAuthCallback()

    return () => {
      isMounted = false
    }
  }, [navigate])

  if (verifying) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>Confirming your magic link...</p>
        <p>Loading...</p>
      </div>
    )
  }

  if (authError) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>Authentication failed</p>
        <p>{authError}</p>
        <button
          onClick={() => {
            setAuthError(null)
            navigate('/', { replace: true })
          }}
        >
          Return to login
        </button>
      </div>
    )
  }

  if (authSuccess) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>Authentication successful!</p>
        <p>Loading your account...</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Authentication</h1>
      <p>Something unexpected happened.</p>
    </div>
  )
}
