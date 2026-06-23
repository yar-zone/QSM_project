import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"
import { TOKEN_KEY } from "@/lib/constants"

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
    <div className="flex min-h-screen items-center justify-center bg-[#FFF0E4] px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-[#D4C9B8] bg-[#FFE0C5] shadow-lg">
        <div className="p-6 text-center">
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl bg-[#007979] text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M16 22V2"/></svg>
          </div>
          <h2 className="text-2xl font-semibold text-[#2D3A3A]">{mode === "register" ? "Create your account" : "Welcome back"}</h2>
          <p className="mt-1 text-sm text-[#6B7A7A]">
            {mode === "register" ? "Register and an administrator will approve your account." : "Sign in to continue to your dashboard."}
          </p>
        </div>
        <div className="p-6 pt-0">
          {mode === "register" ? <RegisterForm /> : <LoginForm />}
          <p className="mt-6 text-center text-sm text-[#6B7A7A]">
            {mode === "register" ? (
              <>Already have an account? <button onClick={() => setMode("login")} className="font-medium text-[#007979] underline">Sign in</button></>
            ) : (
              <>New here? <button onClick={() => setMode("register")} className="font-medium text-[#007979] underline">Create an account</button></>
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
        <label htmlFor="email" className="text-sm font-medium text-[#2D3A3A]">Email</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="flex h-9 w-full rounded-md border border-[#D4C9B8] bg-transparent px-3 py-1 text-base text-[#2D3A3A] placeholder:text-[#6B7A7A] focus:outline-none focus:border-[#007979] md:text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-[#2D3A3A]">Password</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" className="flex h-9 w-full rounded-md border border-[#D4C9B8] bg-transparent px-3 py-1 text-base text-[#2D3A3A] placeholder:text-[#6B7A7A] focus:outline-none focus:border-[#007979] md:text-sm" />
      </div>
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      <button type="submit" disabled={submitting} className="inline-flex h-9 w-full items-center justify-center rounded-md bg-[#007979] px-4 py-2 text-sm font-medium text-white hover:bg-[#007979]/90 disabled:opacity-50">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </button>
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
        <label className="text-sm font-medium text-[#2D3A3A]">I am registering as</label>
        <div className="grid grid-cols-3 gap-2">
          {(["teacher", "student", "parent"] as const).map(r => (
            <button key={r} type="button" onClick={() => setRole(r)} className={`rounded-lg border p-2 text-center text-sm font-medium ${role === r ? "border-[#007979] bg-[#007979] text-white" : "border-[#D4C9B8] bg-[#FFE0C5] text-[#2D3A3A] hover:bg-[#E8D5C0]"}`}>
              {r === "teacher" ? "Teacher" : r === "parent" ? "Parent" : "Student"}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-[#2D3A3A]">Full name</label>
        <input id="name" value={name} onChange={e => setName(e.target.value)} className="flex h-9 w-full rounded-md border border-[#D4C9B8] bg-transparent px-3 py-1 text-base text-[#2D3A3A] placeholder:text-[#6B7A7A] focus:outline-none focus:border-[#007979] md:text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-[#2D3A3A]">Email</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="flex h-9 w-full rounded-md border border-[#D4C9B8] bg-transparent px-3 py-1 text-base text-[#2D3A3A] placeholder:text-[#6B7A7A] focus:outline-none focus:border-[#007979] md:text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-[#2D3A3A]">Phone (optional)</label>
        <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="flex h-9 w-full rounded-md border border-[#D4C9B8] bg-transparent px-3 py-1 text-base text-[#2D3A3A] placeholder:text-[#6B7A7A] focus:outline-none focus:border-[#007979] md:text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-[#2D3A3A]">Password</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" className="flex h-9 w-full rounded-md border border-[#D4C9B8] bg-transparent px-3 py-1 text-base text-[#2D3A3A] placeholder:text-[#6B7A7A] focus:outline-none focus:border-[#007979] md:text-sm" />
      </div>
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      <button type="submit" disabled={submitting} className="inline-flex h-9 w-full items-center justify-center rounded-md bg-[#007979] px-4 py-2 text-sm font-medium text-white hover:bg-[#007979]/90 disabled:opacity-50">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </button>
    </form>
  )
}
