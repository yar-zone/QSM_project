import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ROLE_LABELS } from "@/lib/roles"
import { Badge } from "@/components/ui/badge"
import { userApi } from "@/services/api"

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
})

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
})
type Values = z.infer<typeof schema>

function ProfilePage() {
  const { user, primaryRole, refresh } = useAuth()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: user?.name ?? "", phone: user?.phone ?? "" },
  })

  const onSubmit = async (values: Values) => {
    if (!user) return
    setSaving(true)
    try {
      await userApi.update(user.id, values as any)
      toast.success("Profile updated")
      await refresh()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Update failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="My Profile" description="Manage your personal information." />
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Details</span>
            <Badge variant="outline">{ROLE_LABELS[primaryRole as keyof typeof ROLE_LABELS]}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
