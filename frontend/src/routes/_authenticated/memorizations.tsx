import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Inbox, Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { memorizationApi } from "@/services/api"
import type { MemorizationTracking } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export const Route = createFileRoute("/_authenticated/memorizations")({
  component: MemorizationsPage,
})

function MemorizationsPage() {
  const { isAdmin, isOrganizer, isTeacher } = useAuth()
  const canManage = isAdmin || isOrganizer || isTeacher
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/memorizations"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ verses_memorized: "", verses_revised: "", teacher_notes: "", revision_level: "", performance_score: "" })

  const { data: memorizations, isLoading } = useQuery({
    queryKey: ["memorizations"],
    queryFn: () => memorizationApi.list(),
  })

  const memorizationsList = memorizations ?? []
  const filteredMemorizations = useMemo(() => {
    if (!search.trim()) return memorizationsList
    return memorizationsList.filter((m: MemorizationTracking) =>
      (m.student?.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (m.surah?.name ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [memorizationsList, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => memorizationApi.delete(id),
    onSuccess: () => { toast.success("تم حذف سجل الحفظ"); queryClient.invalidateQueries({ queryKey: ["memorizations"] }); setDeleteId(null) },
    onError: () => toast.error("فشل حذف السجل"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MemorizationTracking> }) => memorizationApi.update(id, data),
    onSuccess: () => { toast.success("تم تحديث سجل الحفظ"); queryClient.invalidateQueries({ queryKey: ["memorizations"] }); setEditId(null) },
    onError: () => toast.error("فشل تحديث السجل"),
  })

  function openEdit(m: MemorizationTracking) {
    setEditForm({
      verses_memorized: m.verses_memorized?.toString() ?? "",
      verses_revised: m.verses_revised?.toString() ?? "",
      teacher_notes: m.teacher_notes ?? "",
      revision_level: m.revision_level ?? "",
      performance_score: m.performance_score?.toString() ?? "",
    })
    setEditId(m.id)
  }

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="تتبع الحفظ" description="تتبع تقدّم حفظ الطلاب.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن حفظ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
        {canManage && <a href="/memorizations/new"><Button><Plus className="ml-1 h-4 w-4" />سجل جديد</Button></a>}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredMemorizations.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "لا توجد سجلات حفظ تطابق بحثك." : "لم يتم العثور على سجلات حفظ."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الطالب</TableHead>
                <TableHead>المعلم</TableHead>
                <TableHead>السورة / الجزء / الحزب</TableHead>
                <TableHead>الآيات المحفوظة</TableHead>
                <TableHead>مستوى المراجعة</TableHead>
                <TableHead>درجة الأداء</TableHead>
                {canManage && <TableHead className="w-24 text-center">الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMemorizations.map((m: MemorizationTracking) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.student?.user?.name ?? `Student #${m.student_id}`}</TableCell>
                  <TableCell>{m.teacher?.user?.name ?? `Teacher #${m.teacher_id}`}</TableCell>
                  <TableCell>{[m.surah?.name, m.juz ? `الجزء ${m.juz}` : "", m.hizb ? `الحزب ${m.hizb}` : ""].filter(Boolean).join(" / ") || "—"}</TableCell>
                  <TableCell>{m.verses_memorized}</TableCell>
                  <TableCell><Badge variant="outline">{m.revision_level ?? "—"}</Badge></TableCell>
                  <TableCell>{m.performance_score ?? "—"}</TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Dialog open={editId === m.id} onOpenChange={(open) => { if (!open) setEditId(null); }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>تعديل سجل الحفظ</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label>الآيات المحفوظة</Label>
                                  <Input type="number" value={editForm.verses_memorized} onChange={(e) => setEditForm(f => ({ ...f, verses_memorized: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>الآيات المراجعة</Label>
                                  <Input type="number" value={editForm.verses_revised} onChange={(e) => setEditForm(f => ({ ...f, verses_revised: e.target.value }))} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label>مستوى المراجعة</Label>
                                  <Select value={editForm.revision_level} onValueChange={(v) => setEditForm(f => ({ ...f, revision_level: v }))}>
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
                                  <Label>درجة الأداء (0-100)</Label>
                                  <Input type="number" min={0} max={100} value={editForm.performance_score} onChange={(e) => setEditForm(f => ({ ...f, performance_score: e.target.value }))} />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label>ملاحظات المعلم</Label>
                                <Textarea value={editForm.teacher_notes} onChange={(e) => setEditForm(f => ({ ...f, teacher_notes: e.target.value }))} />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditId(null)}>إلغاء</Button>
                              <Button
                                onClick={() => updateMutation.mutate({ id: m.id, data: { verses_memorized: Number(editForm.verses_memorized), verses_revised: Number(editForm.verses_revised), teacher_notes: editForm.teacher_notes || undefined, revision_level: editForm.revision_level || undefined, performance_score: editForm.performance_score ? Number(editForm.performance_score) : undefined } })}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                حفظ
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={deleteId === m.id} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(m.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle>
                              <DialogDescription>هل أنت متأكد من حذف سجل الحفظ للطالب {m.student?.user?.name ?? `#${m.student_id}`}؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
                              <Button variant="destructive" onClick={() => deleteMutation.mutate(m.id)} disabled={deleteMutation.isPending}>
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
