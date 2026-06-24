import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Inbox, Plus, Search, Pencil, Trash2 } from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"

import { examResultApi } from "@/services/api"
import type { ExamResult } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export const Route = createFileRoute("/_authenticated/exam-results")({
  component: ExamResultsPage,
})

function ExamResultsPage() {
  const { isAdmin, isOrganizer, isTeacher, isStudent, isParent } = useAuth()
  const canManage = isAdmin || isOrganizer || isTeacher
  const isStudentOrParent = isStudent || isParent
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/exam-results"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ marks_obtained: "", grade: "", evaluator_notes: "", is_passed: false })

  const { data: results, isLoading } = useQuery({
    queryKey: ["exam-results", isStudentOrParent ? "my" : "all"],
    queryFn: () => isStudentOrParent ? examResultApi.myList() : examResultApi.list(),
  })

  const resultsList = results ?? []
  const filteredResults = useMemo(() => {
    if (!search.trim()) return resultsList
    return resultsList.filter((r: ExamResult) =>
      (r.student?.user?.name ?? r.exam_request?.student?.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.grade ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.level?.name ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [resultsList, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => examResultApi.delete(id),
    onSuccess: () => {
      toast.success("تم حذف نتيجة الامتحان")
      queryClient.invalidateQueries({ queryKey: ["exam-results", "all"] }); queryClient.invalidateQueries({ queryKey: ["exam-results", "my"] })
      setDeleteId(null)
    },
    onError: () => toast.error("فشل حذف نتيجة الامتحان"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ExamResult> }) => examResultApi.update(id, data),
    onSuccess: () => {
      toast.success("تم تحديث نتيجة الامتحان")
      queryClient.invalidateQueries({ queryKey: ["exam-results", "all"] }); queryClient.invalidateQueries({ queryKey: ["exam-results", "my"] })
      setEditId(null)
    },
    onError: () => toast.error("فشل تحديث نتيجة الامتحان"),
  })

  function openEdit(r: ExamResult) {
    setEditForm({
      marks_obtained: r.marks_obtained?.toString() ?? "",
      grade: r.grade ?? "",
      evaluator_notes: r.evaluator_notes ?? "",
      is_passed: r.is_passed,
    })
    setEditId(r.id)
  }

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="نتائج الامتحانات" description="عرض جميع نتائج الامتحانات والتقييمات.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن نتيجة امتحان..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
        {canManage ? (
          <a href="/exam-results/new"><Button><Plus className="ml-1 h-4 w-4" />نتيجة جديدة</Button></a>
        ) : (
          <Badge variant="outline">عرض فقط</Badge>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredResults.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "لا توجد نتائج امتحانات تطابق بحثك." : "لم يتم العثور على نتائج امتحانات."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الطالب</TableHead>
                <TableHead>المستوى</TableHead>
                <TableHead>الامتحان (حزب)</TableHead>
                <TableHead>الدرجات</TableHead>
                <TableHead>التقدير</TableHead>
                <TableHead>ناجح/راسب</TableHead>
                <TableHead>المقيّم</TableHead>
                <TableHead>التاريخ</TableHead>
                {canManage && <TableHead className="w-24 text-center">الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((r: ExamResult) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.student?.user?.name ?? r.exam_request?.student?.user?.name ?? `طالب #${r.exam_request?.student_id ?? r.student_id}`}</TableCell>
                  <TableCell>{r.level?.name ?? "—"}</TableCell>
                  <TableCell>{r.exam_request?.hizb_count ?? "—"} حزب</TableCell>
                  <TableCell>{r.marks_obtained ?? "—"}</TableCell>
                  <TableCell>{r.grade ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.is_passed ? "default" : "destructive"}>{r.is_passed ? "ناجح" : "راسب"}</Badge>
                  </TableCell>
                  <TableCell>{r.evaluator?.name ?? "—"}</TableCell>
                  <TableCell>{r.evaluated_at ? new Date(r.evaluated_at).toLocaleDateString() : "—"}</TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Dialog open={editId === r.id} onOpenChange={(open) => { if (!open) setEditId(null); }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>تعديل نتيجة الامتحان</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="space-y-1.5">
                                <Label>الدرجات المحصلة</Label>
                                <Input type="number" value={editForm.marks_obtained} onChange={(e) => setEditForm(f => ({ ...f, marks_obtained: e.target.value }))} />
                              </div>
                              <div className="space-y-1.5">
                                <Label>التقدير</Label>
                                <Input value={editForm.grade} onChange={(e) => setEditForm(f => ({ ...f, grade: e.target.value }))} />
                              </div>
                              <div className="space-y-1.5">
                                <Label>ملاحظات المقيّم</Label>
                                <Textarea value={editForm.evaluator_notes} onChange={(e) => setEditForm(f => ({ ...f, evaluator_notes: e.target.value }))} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox id="edit_is_passed" checked={editForm.is_passed} onCheckedChange={(v) => setEditForm(f => ({ ...f, is_passed: v === true }))} />
                                <Label htmlFor="edit_is_passed">ناجح</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditId(null)}>إلغاء</Button>
                              <Button
                                onClick={() => updateMutation.mutate({ id: r.id, data: { marks_obtained: editForm.marks_obtained ? Number(editForm.marks_obtained) : undefined, grade: editForm.grade || undefined, evaluator_notes: editForm.evaluator_notes || undefined, is_passed: editForm.is_passed } })}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                حفظ
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={deleteId === r.id} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle>
                              <DialogDescription>هل أنت متأكد من حذف نتيجة الامتحان للطالب {r.student?.user?.name ?? r.exam_request?.student?.user?.name ?? `#${r.id}`}؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
                              <Button
                                variant="destructive"
                                onClick={() => deleteMutation.mutate(r.id)}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                حذف
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
