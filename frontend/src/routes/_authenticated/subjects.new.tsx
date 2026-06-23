import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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

export const Route = createFileRoute("/_authenticated/subjects/new")({
  component: NewSubjectPage,
})

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
})

type Values = z.infer<typeof schema>

function NewSubjectPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  })

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await subjectApi.create({
        name: values.name,
        description: values.description || undefined,
      })
      toast.success("تم إنشاء المادة")
      navigate({ to: "/subjects" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء المادة")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="مادة جديدة" description="إنشاء مادة جديدة.">
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
              إنشاء مادة
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
