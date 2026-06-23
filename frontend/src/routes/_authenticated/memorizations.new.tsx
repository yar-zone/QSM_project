import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

import { memorizationApi, studentApi, teacherApi, surahApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const schema = z.object({
  student_id: z.coerce.number({ required_error: "Select a student" }),
  teacher_id: z.coerce.number({ required_error: "Select a teacher" }),
  surah_id: z.coerce.number().optional().or(z.literal("")),
  juz: z.coerce.number().optional().or(z.literal("")),
  hizb: z.coerce.number().optional().or(z.literal("")),
  verses_memorized: z.coerce.number().min(0),
  verses_revised: z.coerce.number().min(0),
  start_date: z.string().min(1, "Start date is required"),
  revision_level: z.string().optional().or(z.literal("")),
  performance_score: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  teacher_notes: z.string().optional().or(z.literal("")),
})
type Values = z.infer<typeof schema>

export const Route = createFileRoute("/_authenticated/memorizations/new")({
  component: NewMemorizationPage,
})

function NewMemorizationPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentApi.list(),
  })

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teacherApi.list(),
  })

  const { data: surahs } = useQuery({
    queryKey: ["surahs"],
    queryFn: () => surahApi.list(),
  })

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { verses_memorized: 0, verses_revised: 0, start_date: new Date().toISOString().split("T")[0] },
  })

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await memorizationApi.create(values)
      toast.success("تم إنشاء سجل الحفظ")
      navigate({ to: "/memorizations" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء السجل")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="سجل حفظ جديد" description="تتبع تقدّم حفظ الطالب." />
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader><CardTitle>تفاصيل الحفظ</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="student_id">الطالب</Label>
              <Select onValueChange={(v) => setValue("student_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="اختر طالباً" /></SelectTrigger>
                <SelectContent>
                  {students?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.user?.name ?? `Student #${s.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.student_id && <p className="text-xs text-destructive">{errors.student_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacher_id">المعلم</Label>
              <Select onValueChange={(v) => setValue("teacher_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="اختر معلماً" /></SelectTrigger>
                <SelectContent>
                  {teachers?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.user?.name ?? `Teacher #${t.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teacher_id && <p className="text-xs text-destructive">{errors.teacher_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="surah_id">السورة</Label>
              <Select onValueChange={(v) => setValue("surah_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="اختر سورة" /></SelectTrigger>
                <SelectContent>
                  {surahs?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name} {s.name_arabic ? `(${s.name_arabic})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="juz">الجزء</Label>
                <Input id="juz" type="number" min={1} max={30} {...register("juz")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hizb">الحزب</Label>
                <Input id="hizb" type="number" min={1} {...register("hizb")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start_date">تاريخ البداية</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
              {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="verses_memorized">الآيات المحفوظة</Label>
                <Input id="verses_memorized" type="number" min={0} {...register("verses_memorized")} />
                {errors.verses_memorized && <p className="text-xs text-destructive">{errors.verses_memorized.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="verses_revised">الآيات المراجعة</Label>
                <Input id="verses_revised" type="number" min={0} {...register("verses_revised")} />
                {errors.verses_revised && <p className="text-xs text-destructive">{errors.verses_revised.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="revision_level">مستوى المراجعة</Label>
                <Select onValueChange={(v) => setValue("revision_level", v)}>
                  <SelectTrigger><SelectValue placeholder="اختر مستوى" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">مبتدئ</SelectItem>
                    <SelectItem value="intermediate">متوسط</SelectItem>
                    <SelectItem value="advanced">متقدم</SelectItem>
                    <SelectItem value="mastered">متقن</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="performance_score">درجة الأداء (0-100)</Label>
                <Input id="performance_score" type="number" min={0} max={100} {...register("performance_score")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacher_notes">ملاحظات المعلم</Label>
              <Textarea id="teacher_notes" {...register("teacher_notes")} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء سجل
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
