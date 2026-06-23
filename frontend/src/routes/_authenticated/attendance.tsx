import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Inbox, Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"

import { attendanceApi } from "@/services/api"
import type { Attendance } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
})

const STATUS_OPTIONS = [
  { value: "present", label: "حاضر" },
  { value: "absent", label: "غائب" },
  { value: "late", label: "متأخر" },
  { value: "excused", label: "معذور" },
]

function statusBadge(status: string) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive"; className: string }> = {
    present: { variant: "default", className: "" },
    absent: { variant: "destructive", className: "" },
    late: { variant: "secondary", className: "bg-amber-500 text-white hover:bg-amber-500/80" },
    excused: { variant: "default", className: "bg-blue-600 text-white hover:bg-blue-600/80" },
  }
  const s = map[status] ?? { variant: "secondary" as const, className: "" }
  const label: Record<string, string> = { present: "حاضر", absent: "غائب", late: "متأخر", excused: "معذور" }
  return <Badge variant={s.variant} className={s.className}>{label[status] ?? status}</Badge>
}

function AttendancePage() {
  const { isAdmin, isOrganizer, isTeacher, isStudent, isParent } = useAuth()
  const canManage = isAdmin || isOrganizer || isTeacher
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/attendance"
  const [search, setSearch] = useState("")
  const [editRecord, setEditRecord] = useState<Attendance | null>(null)
  const [editStatus, setEditStatus] = useState("present")
  const [editNotes, setEditNotes] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: records, isLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: () => attendanceApi.list(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Attendance> }) => attendanceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      toast.success("تم تحديث الحضور")
      setEditRecord(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "فشل التحديث"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => attendanceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      toast.success("تم حذف الحضور")
      setDeleteId(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "فشل الحذف"),
  })

  const recordsList = records ?? []
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return recordsList
    return recordsList.filter((r: Attendance) =>
      (r.student?.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.class?.name ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [recordsList, search])

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="الحضور" description="عرض سجلات الحضور لجميع الطلاب.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن حضور..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
        {canManage && <a href="/attendance/new"><Button><Plus className="ml-1 h-4 w-4" />حضور جديد</Button></a>}
      </PageHeader>

      {isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground">
            <Inbox className="h-7 w-7" />
          </span>
          <div>
            <p className="text-base font-medium text-foreground">{search ? "لا توجد نتائج" : "لا توجد سجلات حضور"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{search ? "لا توجد سجلات تطابق بحثك." : "سجل الحضور لتراه هنا."}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الطالب</TableHead>
                <TableHead>الفصل</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>ملاحظات</TableHead>
                <TableHead>تم بواسطة</TableHead>
                {canManage && <TableHead className="text-center">إجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((r: Attendance) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.student?.user?.name ?? `طالب #${r.student_id}`}</TableCell>
                  <TableCell>{r.class?.name ?? `فصل #${r.class_id}`}</TableCell>
                  <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell>{r.notes ?? "—"}</TableCell>
                  <TableCell>{r.markedBy?.name ?? "—"}</TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Dialog open={editRecord?.id === r.id} onOpenChange={(open) => { if (!open) setEditRecord(null); }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditRecord(r); setEditStatus(r.status); setEditNotes(r.notes ?? ""); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>تعديل الحضور</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <Label>الحالة</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label>ملاحظات</Label>
                                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                              </div>
                              <Button
                                onClick={() => updateMutation.mutate({ id: r.id, data: { status: editStatus, notes: editNotes } })}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                حفظ
                              </Button>
                            </div>
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
                              <DialogDescription>هل أنت متأكد من حذف سجل الحضور هذا؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
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
