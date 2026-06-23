import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { classApi, levelApi, teacherApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export const Route = createFileRoute("/_authenticated/classes/$id/edit")({
  component: EditClassPage,
})

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  level_id: z.string().min(1, "Level is required"),
  teacher_id: z.string().min(1, "Teacher is required"),
  academic_year: z.string().trim().max(20).optional().or(z.literal("")),
  max_students: z.coerce.number().int().positive().optional().or(z.coerce.number().int().min(0)),
  description: z.string().trim().max(500).optional().or(z.literal("")),
})

type Values = z.infer<typeof schema>

function EditClassPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { data: cls, isLoading: loadingClass } = useQuery({
    queryKey: ["class", id],
    queryFn: () => classApi.get(Number(id)),
  })
  const { data: levelResponse } = useQuery({
    queryKey: ["levels"],
    queryFn: levelApi.list,
  })
  const { data: teacherResponse } = useQuery({
    queryKey: ["teachers"],
    queryFn: teacherApi.list,
  })

  const levels = levelResponse ?? []
  const teachers = teacherResponse ?? []

  const { register, handleSubmit, control, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: cls ? {
      name: cls.name,
      level_id: String(cls.level_id),
      teacher_id: String(cls.teacher_id),
      academic_year: cls.academic_year ?? "",
      max_students: cls.max_students ?? undefined,
      description: cls.description ?? "",
    } : undefined,
  })

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await classApi.update(Number(id), {
        name: values.name,
        level_id: Number(values.level_id),
        teacher_id: Number(values.teacher_id),
        academic_year: values.academic_year || undefined,
        max_students: values.max_students || undefined,
        description: values.description || undefined,
      })
      toast.success("تم تحديث الفصل")
      navigate({ to: "/classes" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل تحديث الفصل")
    } finally {
      setSaving(false)
    }
  }

  if (loadingClass) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="تعديل الفصل" description={`تعديل ${cls?.name ?? "الفصل"}.`}>
        <Button variant="outline" asChild>
          <a href="/classes">
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </a>
        </Button>
      </PageHeader>
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>بيانات الفصل</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level_id">المستوى</Label>
              <Controller
                name="level_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.level_id && <p className="text-xs text-destructive">{errors.level_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacher_id">المعلم</Label>
              <Controller
                name="teacher_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر معلماً" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.user?.name ?? `Teacher #${t.id}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.teacher_id && <p className="text-xs text-destructive">{errors.teacher_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="academic_year">السنة الدراسية</Label>
              <Input id="academic_year" {...register("academic_year")} placeholder="مثال: 2025-2026" />
              {errors.academic_year && <p className="text-xs text-destructive">{errors.academic_year.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_students">الحد الأقصى للطلاب</Label>
              <Input id="max_students" type="number" {...register("max_students")} />
              {errors.max_students && <p className="text-xs text-destructive">{errors.max_students.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">الوصف</Label>
              <Textarea id="description" {...register("description")} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
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
