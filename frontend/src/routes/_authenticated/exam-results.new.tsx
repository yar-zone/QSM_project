import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { examResultApi, studentApi, levelApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"

const schema = z.object({
  marks_obtained: z.coerce.number().optional().or(z.literal("")),
  grade: z.string().optional().or(z.literal("")),
  evaluator_notes: z.string().optional().or(z.literal("")),
  is_passed: z.boolean().default(false),
})
type Values = z.infer<typeof schema>

export const Route = createFileRoute("/_authenticated/exam-results/new")({
  component: NewExamResultPage,
})

function NewExamResultPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentApi.list(),
  })

  const { data: levels } = useQuery({
    queryKey: ["levels"],
    queryFn: levelApi.list,
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Values>({
    resolver: zodResolver(schema) as any,
    defaultValues: { is_passed: false },
  })

  const onSubmit: SubmitHandler<Values> = async (values) => {
    setSaving(true)
    try {
      await examResultApi.create({
        student_id: selectedStudent ? Number(selectedStudent) : undefined,
        level_id: selectedLevel ? Number(selectedLevel) : undefined,
        ...values,
        marks_obtained: values.marks_obtained ? Number(values.marks_obtained) : undefined,
      } as any)
      toast.success("تم إنشاء نتيجة الامتحان")
      navigate({ to: "/exam-results" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء نتيجة الامتحان")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="نتيجة امتحان جديدة" description="تسجيل نتيجة امتحان جديدة." />
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader><CardTitle>تفاصيل النتيجة</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="student_id">الطالب</Label>
              <Select onValueChange={(v) => setSelectedStudent(v)}>
                <SelectTrigger><SelectValue placeholder="اختر طالباً" /></SelectTrigger>
                <SelectContent>
                  {students?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.user?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level_id">مستوى الامتحان</Label>
              <Select onValueChange={(v) => setSelectedLevel(v)}>
                <SelectTrigger><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
                <SelectContent>
                  {levels?.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="marks_obtained">الدرجات المحصلة</Label>
              <Input id="marks_obtained" type="number" {...register("marks_obtained")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grade">التقدير</Label>
              <Input id="grade" {...register("grade")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evaluator_notes">ملاحظات المقيّم</Label>
              <Textarea id="evaluator_notes" {...register("evaluator_notes")} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="is_passed" checked={watch("is_passed")} onCheckedChange={(v) => setValue("is_passed", v === true)} />
              <Label htmlFor="is_passed">ناجح</Label>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء نتيجة امتحان
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
