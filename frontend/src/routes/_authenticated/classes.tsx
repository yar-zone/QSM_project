import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Inbox, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { classApi, levelApi, teacherApi } from "@/services/api"
import type { Classe } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export const Route = createFileRoute("/_authenticated/classes")({
  component: ClassesPage,
})

function ClassesPage() {
  const { isAdmin, isOrganizer, isTeacher, isStudent, isParent } = useAuth()
  const canManage = isAdmin || isOrganizer
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/classes"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editLevelId, setEditLevelId] = useState("")
  const [editTeacherId, setEditTeacherId] = useState("")
  const [editAcademicYear, setEditAcademicYear] = useState("")
  const [editMaxStudents, setEditMaxStudents] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: classApi.list,
  })
  const { data: levels } = useQuery({
    queryKey: ["levels"],
    queryFn: levelApi.list,
  })
  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: teacherApi.list,
  })

  const classesList = classes ?? []
  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classesList
    return classesList.filter((c: Classe) =>
      (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.level?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.teacher?.user?.name ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [classesList, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => classApi.delete(id),
    onSuccess: () => {
      toast.success("تم حذف الفصل")
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      setDeleteId(null)
    },
    onError: () => toast.error("فشل حذف الفصل"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => classApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("تم تحديث الفصل")
      setEditId(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "فشل تحديث الفصل")
    },
  })

  function openEdit(c: Classe) {
    setEditName(c.name)
    setEditLevelId(String(c.level_id))
    setEditTeacherId(String(c.teacher_id))
    setEditAcademicYear(c.academic_year ?? "")
    setEditMaxStudents(c.max_students ? String(c.max_students) : "")
    setEditDescription(c.description ?? "")
    setEditId(c.id)
  }

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="الفصول" description="إدارة جميع الفصول.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن فصل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
        {(isAdmin || isOrganizer) && (
          <a href="/classes/new">
            <Button>
              <Plus className="h-4 w-4" />
              فصل جديد
            </Button>
          </a>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "لا يوجد فصول تطابق بحثك." : "لم يتم العثور على فصول."}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>المستوى</TableHead>
                  <TableHead>المعلم</TableHead>
                  <TableHead>السنة الدراسية</TableHead>
                  <TableHead>الحد الأقصى للطلاب</TableHead>
                  <TableHead>الحالة</TableHead>
                  {canManage && <TableHead className="w-32 text-center">الإجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((c: Classe) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.level?.name ?? "—"}</TableCell>
                    <TableCell>{c.teacher?.user?.name ?? "—"}</TableCell>
                    <TableCell>{c.academic_year ?? "—"}</TableCell>
                    <TableCell>{c.max_students ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Dialog open={editId === c.id} onOpenChange={(open) => { if (!open) setEditId(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader><DialogTitle>تعديل الفصل</DialogTitle></DialogHeader>
                              <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                                <div className="space-y-1.5">
                                  <Label>الاسم</Label>
                                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>المستوى</Label>
                                  <Select onValueChange={setEditLevelId} value={editLevelId}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر مستوى" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(levels ?? []).map((l) => (
                                        <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label>المعلم</Label>
                                  <Select onValueChange={setEditTeacherId} value={editTeacherId}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر معلماً" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(teachers ?? []).map((t: any) => (
                                        <SelectItem key={t.id} value={String(t.id)}>{t.user?.name ?? `معلم #${t.id}`}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label>السنة الدراسية</Label>
                                  <Input value={editAcademicYear} onChange={(e) => setEditAcademicYear(e.target.value)} placeholder="مثال: 2025-2026" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>الحد الأقصى للطلاب</Label>
                                  <Input type="number" value={editMaxStudents} onChange={(e) => setEditMaxStudents(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>الوصف</Label>
                                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditId(null)}>إلغاء</Button>
                                <Button
                                  onClick={() => updateMutation.mutate({ id: c.id, data: { name: editName, level_id: Number(editLevelId), teacher_id: Number(editTeacherId), academic_year: editAcademicYear || undefined, max_students: editMaxStudents ? Number(editMaxStudents) : undefined, description: editDescription || undefined } })}
                                  disabled={updateMutation.isPending}
                                >
                                  {updateMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                  حفظ
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={deleteId === c.id} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle>
                                <DialogDescription>هل أنت متأكد من حذف الفصل {c.name}؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => deleteMutation.mutate(c.id)}
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
