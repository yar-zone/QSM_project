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
import { userApi, authApi } from "@/services/api"

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
})

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
})
type Values = z.infer<typeof schema>

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  new_password_confirmation: z.string().min(1, "Confirm your new password"),
}).refine(data => data.new_password === data.new_password_confirmation, {
  message: "Passwords do not match",
  path: ["new_password_confirmation"],
})
type PasswordValues = z.infer<typeof passwordSchema>

function ProfilePage() {
  const { user, primaryRole, refresh } = useAuth()
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: user?.name ?? "", phone: user?.phone ?? "" },
  })

  const { register: registerPw, handleSubmit: handleSubmitPw, formState: { errors: errorsPw }, reset: resetPw, watch: watchPw } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", new_password_confirmation: "" },
  })

  const onSubmit = async (values: Values) => {
    if (!user) return
    setSaving(true)
    try {
      await userApi.update(user.id, values as any)
      toast.success("تم تحديث الملف الشخصي")
      await refresh()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل التحديث")
    } finally {
      setSaving(false)
    }
  }

  const onSubmitPassword = async (values: PasswordValues) => {
    setSavingPassword(true)
    try {
      await authApi.changePassword(values)
      toast.success("تم تغيير كلمة المرور بنجاح")
      resetPw()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل تغيير كلمة المرور")
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="ملفي الشخصي" description="إدارة معلوماتك الشخصية." />
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>التفاصيل</span>
            <Badge variant="outline">{ROLE_LABELS[primaryRole as keyof typeof ROLE_LABELS]}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">الهاتف</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-[var(--shadow-card)] mt-6">
        <CardHeader>
          <CardTitle>تغيير كلمة المرور</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPw(onSubmitPassword)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current_password">كلمة المرور الحالية</Label>
              <Input id="current_password" type="password" {...registerPw("current_password")} />
              {errorsPw.current_password && <p className="text-xs text-destructive">{errorsPw.current_password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_password">كلمة المرور الجديدة</Label>
              <Input id="new_password" type="password" {...registerPw("new_password")} />
              {errorsPw.new_password && <p className="text-xs text-destructive">{errorsPw.new_password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_password_confirmation">تأكيد كلمة المرور الجديدة</Label>
              <Input id="new_password_confirmation" type="password" {...registerPw("new_password_confirmation")} />
              {errorsPw.new_password_confirmation && <p className="text-xs text-destructive">{errorsPw.new_password_confirmation.message}</p>}
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تغيير كلمة المرور
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
