import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { attendanceApi, classApi } from "@/services/api"
import type { Student } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const Route = createFileRoute("/_authenticated/attendance/new")({
  component: NewAttendancePage,
})

type Status = "present" | "absent" | "excused" | "late"

const STATUS_OPTIONS: { value: Status; label: string; icon: React.ReactNode }[] = [
  { value: "present", label: "Present", icon: <CheckCircle className="h-4 w-4 text-green-600" /> },
  { value: "absent", label: "Absent", icon: <XCircle className="h-4 w-4 text-red-600" /> },
  { value: "excused", label: "Excused", icon: <AlertTriangle className="h-4 w-4 text-blue-600" /> },
  { value: "late", label: "Late", icon: <Clock className="h-4 w-4 text-amber-600" /> },
]

function NewAttendancePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [classId, setClassId] = useState<string>("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [statuses, setStatuses] = useState<Record<number, Status>>({})

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classApi.list(),
  })

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => classApi.students(Number(classId)),
    enabled: !!classId,
  })

  function setStudentStatus(studentId: number, status: Status) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }))
  }

  function markAllAs(status: Status) {
    if (!students) return
    const next = { ...statuses }
    students.forEach((s: Student) => { next[s.id] = status })
    setStatuses(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!classId || !date) { toast.error("Select a class and date"); return }
    if (!students || students.length === 0) { toast.error("No students in this class"); return }

    const attendances = students.map((s: Student) => ({
      student_id: s.id,
      status: statuses[s.id] ?? "present",
    }))

    setSaving(true)
    try {
      await attendanceApi.bulk({ class_id: Number(classId), date, attendances })
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      toast.success("Attendance saved")
      navigate({ to: "/attendance" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save attendance")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Mark Attendance" description="Record attendance for a whole class." />
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader><CardTitle>Attendance Form</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="class">Class</Label>
                <Select value={classId} onValueChange={(v) => { setClassId(v); setStatuses({}) }}>
                  <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
                  <SelectContent>
                    {classes?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            {classId && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Quick mark all as:</span>
                  {STATUS_OPTIONS.map((opt) => (
                    <Button key={opt.value} type="button" variant="outline" size="sm" onClick={() => markAllAs(opt.value)}>
                      {opt.icon}{opt.label}
                    </Button>
                  ))}
                </div>

                {loadingStudents ? (
                  <div className="grid place-items-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : !students || students.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No students enrolled in this class.</p>
                ) : (
                  <div className="max-h-96 overflow-y-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Student</th>
                          <th className="text-center px-3 py-2 font-medium">Present</th>
                          <th className="text-center px-3 py-2 font-medium">Absent</th>
                          <th className="text-center px-3 py-2 font-medium">Excused</th>
                          <th className="text-center px-3 py-2 font-medium">Late</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s: Student, idx: number) => {
                          const current = statuses[s.id] ?? "present"
                          return (
                            <tr key={s.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                              <td className="px-3 py-2">{s.user?.name ?? `Student #${s.id}`}</td>
                              {(STATUS_OPTIONS.map(o => o.value)).map((status) => (
                                <td key={status} className="text-center px-1 py-2">
                                  <input
                                    type="radio"
                                    name={`status-${s.id}`}
                                    value={status}
                                    checked={current === status}
                                    onChange={() => setStudentStatus(s.id, status as Status)}
                                    className="h-4 w-4 text-primary accent-primary"
                                  />
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <Button type="submit" disabled={saving || !students || students.length === 0}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Attendance
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
