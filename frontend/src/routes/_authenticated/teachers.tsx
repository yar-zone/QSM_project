import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Inbox, Pencil, Trash2, Search } from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"

import { teacherApi } from "@/services/api"
import type { Teacher } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export const Route = createFileRoute("/_authenticated/teachers")({
  component: TeachersPage,
})

function TeachersPage() {
  const { isAdmin, isOrganizer } = useAuth()
  const canManage = isAdmin || isOrganizer
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/teachers"
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editQualification, setEditQualification] = useState("")
  const [editSpecialization, setEditSpecialization] = useState("")
  const [editIsActive, setEditIsActive] = useState(true)
  const { data, isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teacherApi.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => teacherApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] })
      toast.success("تم حذف المعلم")
      setDeleteId(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "فشل حذف المعلم"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => teacherApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] })
      toast.success("تم تحديث المعلم")
      setEditId(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "فشل تحديث المعلم")
    },
  })

  function openEdit(t: Teacher) {
    setEditName(t.user?.name ?? "")
    setEditEmail(t.user?.email ?? "")
    setEditPhone(t.user?.phone ?? "")
    setEditQualification(t.qualification ?? "")
    setEditSpecialization(t.specialization ?? "")
    setEditIsActive(t.is_active)
    setEditId(t.id)
  }

  const teachersList = data ?? []
  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachersList
    return teachersList.filter((t: Teacher) =>
      (t.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.user?.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.qualification ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [teachersList, search])

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="المعلمون" description="إدارة حسابات المعلمين وملفاتهم.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن معلم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
        {(isAdmin || isOrganizer) && (
          <a href="/teachers/new">
            <Button>
              <Plus className="h-4 w-4" />
              معلم جديد
            </Button>
          </a>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredTeachers.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "لا يوجد معلمون يطابقون بحثك." : "لم يتم العثور على معلمين."}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>المؤهل</TableHead>
                  <TableHead>التخصص</TableHead>
                  <TableHead>الحالة</TableHead>
                  {canManage && <TableHead className="w-32 text-center">الإجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((t: Teacher) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.user?.name ?? "—"}</TableCell>
                    <TableCell>{t.user?.email ?? "—"}</TableCell>
                    <TableCell>{t.qualification ?? "—"}</TableCell>
                    <TableCell>{t.specialization ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? "default" : "secondary"}>
                        {t.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Dialog open={editId === t.id} onOpenChange={(open) => { if (!open) setEditId(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader><DialogTitle>تعديل المعلم</DialogTitle></DialogHeader>
                              <div className="space-y-4 py-2">
                                <div className="space-y-1.5">
                                  <Label>الاسم الكامل</Label>
                                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>البريد الإلكتروني</Label>
                                  <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>الهاتف</Label>
                                  <Input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>المؤهل</Label>
                                  <Input value={editQualification} onChange={(e) => setEditQualification(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>التخصص</Label>
                                  <Input value={editSpecialization} onChange={(e) => setEditSpecialization(e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    id="edit_is_active"
                                    type="checkbox"
                                    checked={editIsActive}
                                    onChange={(e) => setEditIsActive(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <Label htmlFor="edit_is_active">نشط</Label>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditId(null)}>إلغاء</Button>
                                <Button
                                  onClick={() => updateMutation.mutate({ id: t.id, data: { name: editName, email: editEmail, phone: editPhone || undefined, qualification: editQualification || undefined, specialization: editSpecialization || undefined, is_active: editIsActive } })}
                                  disabled={updateMutation.isPending}
                                >
                                  {updateMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                  حفظ
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={deleteId === t.id} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle>
                                <DialogDescription>هل أنت متأكد من حذف المعلم {t.user?.name}؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => deleteMutation.mutate(t.id)}
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
