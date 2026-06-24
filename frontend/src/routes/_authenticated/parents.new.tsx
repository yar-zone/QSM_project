import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { parentApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_authenticated/parents/new")({
  component: NewParentPage,
})

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirmation: z.string().min(1, "Confirm your password"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
})

type Values = z.infer<typeof schema>

function NewParentPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", email: "", password: "", password_confirmation: "",
      phone: "",
    },
  })

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await parentApi.create({
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        role: "parent",
        phone: values.phone || undefined,
      })
      toast.success("تم إنشاء ولي الأمر")
      navigate({ to: "/parents" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء ولي الأمر")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="ولي أمر جديد" description="إنشاء حساب ولي أمر جديد.">
        <a href="/parents">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </Button>
        </a>
      </PageHeader>
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>بيانات ولي الأمر</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password_confirmation">تأكيد كلمة المرور</Label>
              <Input id="password_confirmation" type="password" {...register("password_confirmation")} />
              {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">الهاتف</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء ولي أمر
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
