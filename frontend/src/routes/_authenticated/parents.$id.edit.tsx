import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { parentApi, studentApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_authenticated/parents/$id/edit")({
  component: EditParentPage,
})

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  student_ids: z.array(z.number()).optional(),
})

type Values = z.infer<typeof schema>

function EditParentPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])

  const { data: parent, isLoading: loadingParent } = useQuery({
    queryKey: ["parent", id],
    queryFn: () => parentApi.get(Number(id)),
  })

  useEffect(() => {
    if (parent) {
      const ids = (parent as any)?.parentStudents?.map((s: any) => s.id) ?? []
      setSelectedStudents(ids)
    }
  }, [parent])

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentApi.list(),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: parent ? {
      name: parent.name ?? "",
      email: parent.email ?? "",
      phone: parent.phone ?? "",
      student_ids: (parent as any).parentStudents?.map((s: any) => s.id) ?? [],
    } : undefined,
  })

  const toggleStudent = (id: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await parentApi.update(Number(id), {
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        student_ids: selectedStudents,
      })
      queryClient.invalidateQueries({ queryKey: ["parents"] })
      toast.success("تم تحديث ولي الأمر")
      navigate({ to: "/parents" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل تحديث ولي الأمر")
    } finally {
      setSaving(false)
    }
  }

  if (loadingParent) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const linkedIds = selectedStudents

  return (
    <div className="max-w-xl">
      <PageHeader title="تعديل ولي الأمر" description={`تعديل ${parent?.name ?? "ولي الأمر"}.`}>
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
              <Label htmlFor="phone">الهاتف</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>الطلاب المرتبطون</Label>
              {students && students.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
                  {students.map((s) => {
                    const checked = linkedIds.includes(s.id)
                    return (
                      <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStudent(s.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        {s.user?.name ?? `Student #${s.id}`}
                      </label>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا يوجد طلاب متاحون.</p>
              )}
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
