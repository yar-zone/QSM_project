import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Loader2, Video } from "lucide-react"
import { toast } from "sonner"

import { announcementApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const AUDIENCE_ROLES = [
  { value: "organizer", label: "المنظمون" },
  { value: "teacher", label: "المعلمون" },
  { value: "student", label: "الطلاب" },
  { value: "parent", label: "أولياء الأمور" },
] as const

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
  const [selectedAudience, setSelectedAudience] = useState<string[]>([])
  const [audienceError, setAudienceError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { category: "general", is_pinned: false, published_at: new Date().toISOString().slice(0, 10) },
  })

  function toggleAudience(role: string) {
    setSelectedAudience((prev) => {
      const next = prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
      setAudienceError(null)
      return next
    })
  }

  const onSubmit = async (values: Values) => {
    if (selectedAudience.length === 0) {
      setAudienceError("اختر جمهوراً واحداً على الأقل")
      return
    }
    setSaving(true)
    try {
      await announcementApi.create({
        ...values,
        target_audience: selectedAudience.join(","),
      })
      toast.success("تم إنشاء الإعلان")
      navigate({ to: "/announcements" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء الإعلان")
    } finally {
      setSaving(false)
    }
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
            <div className="space-y-1.5">
              <Label>الجمهور المستهدف</Label>
              <div className="grid grid-cols-2 gap-2">
                {AUDIENCE_ROLES.map((role) => {
                  const checked = selectedAudience.includes(role.value)
                  return (
                    <label
                      key={role.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                        checked
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleAudience(role.value)}
                      />
                      {role.label}
                    </label>
                  )
                })}
              </div>
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
