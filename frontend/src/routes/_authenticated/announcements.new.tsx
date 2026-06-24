import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState, useEffect } from "react"
import { Loader2, Video } from "lucide-react"
import { toast } from "sonner"

import { announcementApi, classApi, teacherApi, organizerApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Classe, Teacher, Organizer } from "@/types"

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(255),
  content: z.string().trim().min(10, "Content must be at least 10 characters"),
  category: z.string({ required_error: "Select a category" }),
  meeting_link: z.string().optional().or(z.literal("")),
  is_pinned: z.boolean().default(false),
  published_at: z.string().min(1, "Date is required"),
})
type Values = z.infer<typeof schema>

export const Route = createFileRoute("/_authenticated/announcements/new")({
  component: NewAnnouncementPage,
})

function NewAnnouncementPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const [classes, setClasses] = useState<Classe[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loadingLists, setLoadingLists] = useState(true)

  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [audienceError, setAudienceError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { category: "general", is_pinned: false, published_at: new Date().toISOString().slice(0, 10) },
  })

  useEffect(() => {
    Promise.all([
      classApi.list().catch(() => []),
      teacherApi.list().catch(() => []),
      organizerApi.list().catch(() => []),
    ]).then(([c, t, o]) => {
      setClasses(c)
      setTeachers(t)
      setOrganizers(o)
    }).finally(() => setLoadingLists(false))
  }, [])

  const allClassesChecked = classes.length > 0 && selectedClassIds.length === classes.length
  const allTeachersChecked = teachers.length > 0 && selectedUserIds.filter(id => teachers.some(t => t.user_id === id)).length === teachers.length
  const allOrganizersChecked = organizers.length > 0 && selectedUserIds.filter(id => organizers.some(o => o.user_id === id)).length === organizers.length

  function toggleSelectAllClasses() {
    if (allClassesChecked) {
      setSelectedClassIds([])
    } else {
      setSelectedClassIds(classes.map(c => c.id))
    }
  }

  function toggleClass(classId: number) {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    )
  }

  function toggleSelectAllTeachers() {
    const teacherUserIds = teachers.map(t => t.user_id)
    if (allTeachersChecked) {
      setSelectedUserIds(prev => prev.filter(id => !teacherUserIds.includes(id)))
    } else {
      setSelectedUserIds(prev => [...new Set([...prev, ...teacherUserIds])])
    }
  }

  function toggleUser(userId: number) {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  function toggleSelectAllOrganizers() {
    const organizerUserIds = organizers.map(o => o.user_id)
    if (allOrganizersChecked) {
      setSelectedUserIds(prev => prev.filter(id => !organizerUserIds.includes(id)))
    } else {
      setSelectedUserIds(prev => [...new Set([...prev, ...organizerUserIds])])
    }
  }

  function computeTargetAudience(): string {
    const parts: string[] = []
    if (selectedClassIds.length > 0) parts.push("student")
    const teacherUserIds = teachers.map(t => t.user_id)
    if (selectedUserIds.some(id => teacherUserIds.includes(id))) parts.push("teacher")
    const organizerUserIds = organizers.map(o => o.user_id)
    if (selectedUserIds.some(id => organizerUserIds.includes(id))) parts.push("organizer")
    return parts.join(",")
  }

  const onSubmit = async (values: Values) => {
    const audience = computeTargetAudience()
    if (!audience) {
      setAudienceError("اختر جمهوراً واحداً على الأقل")
      return
    }
    setSaving(true)
    try {
      await announcementApi.create({
        ...values,
        target_audience: audience,
        target_class_ids: selectedClassIds,
        target_user_ids: selectedUserIds,
      })
      toast.success("تم إنشاء الإعلان")
      navigate({ to: "/announcements" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء الإعلان")
    } finally {
      setSaving(false)
    }
  }

  if (loadingLists) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="إعلان جديد" description="إنشاء إعلان جديد." />
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader><CardTitle>تفاصيل الإعلان</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">العنوان</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">المحتوى</Label>
              <Textarea id="content" rows={5} {...register("content")} />
              {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">التصنيف</Label>
              <Select onValueChange={(v) => setValue("category", v)} defaultValue="general">
                <SelectTrigger><SelectValue placeholder="اختر تصنيفاً" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">عام</SelectItem>
                  <SelectItem value="exams">امتحانات</SelectItem>
                  <SelectItem value="events">فعاليات</SelectItem>
                  <SelectItem value="meetings">اجتماعات</SelectItem>
                  <SelectItem value="urgent">عاجل</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            {/* --- Target Audience --- */}
            <div className="space-y-3">
              <Label>الجمهور المستهدف</Label>

              {classes.length > 0 && (
                <div className="rounded-lg border p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <Checkbox checked={allClassesChecked} onCheckedChange={toggleSelectAllClasses} />
                    الفصول — تحديد الكل
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 pr-6">
                    {classes.map((c) => {
                      const checked = selectedClassIds.includes(c.id)
                      return (
                        <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox checked={checked} onCheckedChange={() => toggleClass(c.id)} />
                          {c.name}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {teachers.length > 0 && (
                <div className="rounded-lg border p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <Checkbox checked={allTeachersChecked} onCheckedChange={toggleSelectAllTeachers} />
                    المعلمون — تحديد الكل
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 pr-6">
                    {teachers.map((t) => {
                      const checked = selectedUserIds.includes(t.user_id)
                      return (
                        <label key={t.user_id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox checked={checked} onCheckedChange={() => toggleUser(t.user_id)} />
                          {t.user.name}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {organizers.length > 0 && (
                <div className="rounded-lg border p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <Checkbox checked={allOrganizersChecked} onCheckedChange={toggleSelectAllOrganizers} />
                    المنظمون — تحديد الكل
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 pr-6">
                    {organizers.map((o) => {
                      const checked = selectedUserIds.includes(o.user_id)
                      return (
                        <label key={o.user_id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox checked={checked} onCheckedChange={() => toggleUser(o.user_id)} />
                          {o.user.name}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {audienceError && <p className="text-xs text-destructive">{audienceError}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                رابط الاجتماع (اختياري)
              </Label>
              <Input id="meeting_link" {...register("meeting_link")} placeholder="https://meet.jit.si/..." />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="is_pinned" checked={watch("is_pinned")} onCheckedChange={(v) => setValue("is_pinned", v === true)} />
              <Label htmlFor="is_pinned">تثبيت هذا الإعلان</Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="published_at">تاريخ النشر</Label>
              <Input id="published_at" type="date" {...register("published_at")} />
              {errors.published_at && <p className="text-xs text-destructive">{errors.published_at.message}</p>}
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء إعلان
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
