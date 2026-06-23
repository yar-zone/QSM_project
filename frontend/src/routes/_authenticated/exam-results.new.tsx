import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

import { examResultApi, examRequestApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const schema = z.object({
  exam_request_id: z.coerce.number({ required_error: "Select an exam" }),
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

  const { data: exams } = useQuery({
    queryKey: ["exam-requests"],
    queryFn: () => examRequestApi.list(),
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { is_passed: false },
  })

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await examResultApi.create({
        ...values,
        marks_obtained: values.marks_obtained ? Number(values.marks_obtained) : undefined,
      })
      toast.success("Exam result created")
      navigate({ to: "/exam-results" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create exam result")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="New Exam Result" description="Record a new exam result." />
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader><CardTitle>Result Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="exam_request_id">Exam Request</Label>
              <Select onValueChange={(v) => setValue("exam_request_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select an exam" /></SelectTrigger>
                <SelectContent>
                  {exams?.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.student?.user?.name ?? `Student #${e.student_id}`} — {e.hizb_count} hizb ({e.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.exam_request_id && <p className="text-xs text-destructive">{errors.exam_request_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="marks_obtained">Marks Obtained</Label>
              <Input id="marks_obtained" type="number" {...register("marks_obtained")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grade">Grade</Label>
              <Input id="grade" {...register("grade")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evaluator_notes">Evaluator Notes</Label>
              <Textarea id="evaluator_notes" {...register("evaluator_notes")} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="is_passed" checked={watch("is_passed")} onCheckedChange={(v) => setValue("is_passed", v === true)} />
              <Label htmlFor="is_passed">Passed</Label>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Exam Result
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
