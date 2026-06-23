import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Loader2, BookOpen } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"
import { TOKEN_KEY } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const Route = createFileRoute("/auth")({
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()
  const params = new URLSearchParams(window.location.search)
  const [mode, setMode] = useState<"login" | "register">(params.get("mode") === "register" ? "register" : "login")

  useEffect(() => {
    if (!loading && isAuthenticated && localStorage.getItem(TOKEN_KEY)) {
      navigate({ to: "/dashboard" })
    }
  }, [loading, isAuthenticated, navigate])

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 pattern-dots">
      <div className="w-full max-w-md fade-in-up">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/25">
            <BookOpen className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Nur Quran</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quran School Management</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-foreground">{mode === "register" ? "Create an account" : "Welcome back"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "register" ? "Register and an administrator will approve your account." : "Sign in to continue to your dashboard."}
            </p>
          </div>

          {mode === "register" ? <RegisterForm /> : <LoginForm />}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "register" ? (
              <>Already have an account? <button onClick={() => setMode("login")} className="font-medium text-primary underline-offset-4 hover:underline">Sign in</button></>
            ) : (
              <>New here? <button onClick={() => setMode("register")} className="font-medium text-primary underline-offset-4 hover:underline">Create an account</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError("Email is required"); return }
    if (!password) { setError("Password is required"); return }
    setSubmitting(true)
    setError(null)
    try {
      await login(email.trim(), password)
      toast.success("Signed in")
      navigate({ to: "/dashboard" })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Login failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  )
}

function RegisterForm() {
  const navigate = useNavigate()
  const { register: signUp } = useAuth()
  const [role, setRole] = useState<"teacher" | "student" | "parent">("student")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError("Name is required"); return }
    if (!email.trim()) { setError("Email is required"); return }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters"); return }
    setSubmitting(true)
    try {
      await signUp({ name: name.trim(), email: email.trim(), password, password_confirmation: password, role, phone: phone.trim() || undefined })
      toast.success("Account created! Awaiting approval.")
      navigate({ to: "/dashboard" })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Registration failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>I am registering as</Label>
        <div className="grid grid-cols-3 gap-2">
          {(["teacher", "student", "parent"] as const).map(r => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`rounded-lg border px-3 py-2 text-center text-sm font-medium transition-all ${
                role === r
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-foreground hover:bg-accent"
              }`}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" placeholder="Min. 6 characters" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  )
}
