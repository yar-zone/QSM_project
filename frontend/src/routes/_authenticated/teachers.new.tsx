import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { teacherApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_authenticated/teachers/new")({
  component: NewTeacherPage,
})

const schema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب").max(120),
  email: z.string().trim().min(1, "البريد الإلكتروني مطلوب").email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  password_confirmation: z.string().min(1, "تأكيد كلمة المرور"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  qualification: z.string().trim().optional().or(z.literal("")),
  specialization: z.string().trim().optional().or(z.literal("")),
}).refine((data) => data.password === data.password_confirmation, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["password_confirmation"],
})

type Values = z.infer<typeof schema>

function NewTeacherPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", email: "", password: "", password_confirmation: "",
      phone: "", qualification: "", specialization: "",
    },
  })

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await teacherApi.create({
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        role: "teacher",
        phone: values.phone || undefined,
        qualification: values.qualification || undefined,
        specialization: values.specialization || undefined,
      })
      toast.success("تم إنشاء المعلم")
      navigate({ to: "/teachers" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء المعلم")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="معلم جديد" description="إنشاء حساب معلم جديد.">
        <Button variant="outline" asChild>
          <a href="/teachers">
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </a>
        </Button>
      </PageHeader>
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>بيانات المعلم</CardTitle>
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
            <div className="space-y-1.5">
              <Label htmlFor="qualification">المؤهل</Label>
              <Input id="qualification" {...register("qualification")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specialization">التخصص</Label>
              <Input id="specialization" {...register("specialization")} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء معلم
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
