import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { subjectApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_authenticated/subjects/$id/edit")({
  component: EditSubjectPage,
})

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
})

type Values = z.infer<typeof schema>

function EditSubjectPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { data: subject, isLoading: loadingSubject } = useQuery({
    queryKey: ["subject", id],
    queryFn: () => subjectApi.get(Number(id)),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: subject ? {
      name: subject.name,
      description: subject.description ?? "",
    } : undefined,
  })

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await subjectApi.update(Number(id), {
        name: values.name,
        description: values.description || undefined,
      })
      toast.success("تم تحديث المادة")
      navigate({ to: "/subjects" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل تحديث المادة")
    } finally {
      setSaving(false)
    }
  }

  if (loadingSubject) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="تعديل المادة" description={`تعديل ${subject?.name ?? "المادة"}.`}>
        <Button variant="outline" asChild>
          <a href="/subjects">
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </a>
        </Button>
      </PageHeader>
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>بيانات المادة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
