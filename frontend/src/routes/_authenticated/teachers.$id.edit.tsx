import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
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

export const Route = createFileRoute("/_authenticated/teachers/$id/edit")({
  component: EditTeacherPage,
})

const schema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب").max(120),
  email: z.string().trim().min(1, "البريد الإلكتروني مطلوب").email("بريد إلكتروني غير صالح"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  qualification: z.string().trim().optional().or(z.literal("")),
  specialization: z.string().trim().optional().or(z.literal("")),
  is_active: z.boolean().optional(),
})

type Values = z.infer<typeof schema>

function EditTeacherPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { data: teacher, isLoading: loadingTeacher } = useQuery({
    queryKey: ["teacher", id],
    queryFn: () => teacherApi.get(Number(id)),
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Values>({
    resolver: zodResolver(schema),
    values: teacher ? {
      name: teacher.user?.name ?? "",
      email: teacher.user?.email ?? "",
      phone: teacher.user?.phone ?? "",
      qualification: teacher.qualification ?? "",
      specialization: teacher.specialization ?? "",
      is_active: teacher.is_active,
    } : undefined,
  })

  const isActive = watch("is_active")

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await teacherApi.update(Number(id), {
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        qualification: values.qualification || undefined,
        specialization: values.specialization || undefined,
        is_active: values.is_active,
      })
      toast.success("تم تحديث المعلم")
      navigate({ to: "/teachers" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل تحديث المعلم")
    } finally {
      setSaving(false)
    }
  }

  if (loadingTeacher) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="تعديل المعلم" description={`تعديل ${teacher?.user?.name ?? "teacher"}.`}>
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
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setValue("is_active", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is_active">نشط</Label>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
