import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Inbox, Pencil, Trash2, Search } from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"

import { organizerApi } from "@/services/api"
import type { Organizer } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export const Route = createFileRoute("/_authenticated/organizers")({
  component: OrganizersPage,
})

function OrganizersPage() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editQuals, setEditQuals] = useState("")
  const [editIsActive, setEditIsActive] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState("")
  const [addEmail, setAddEmail] = useState("")
  const [addPassword, setAddPassword] = useState("")
  const [addPhone, setAddPhone] = useState("")
  const [addQuals, setAddQuals] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["organizers"],
    queryFn: () => organizerApi.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => organizerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizers"] })
      toast.success("تم حذف المنظم")
      setDeleteId(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "فشل حذف المنظم"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => organizerApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizers"] })
      toast.success("تم تحديث المنظم")
      setEditId(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "فشل تحديث المنظم")
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => organizerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizers"] })
      toast.success("تم إنشاء المنظم")
      setShowAdd(false)
      setAddName(""); setAddEmail(""); setAddPassword(""); setAddPhone(""); setAddQuals("")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "فشل إنشاء المنظم")
    },
  })

  function openEdit(o: Organizer) {
    setEditName(o.user?.name ?? "")
    setEditEmail(o.user?.email ?? "")
    setEditPhone(o.phone ?? "")
    setEditQuals(o.qualifications ?? "")
    setEditIsActive(o.is_active)
    setEditId(o.id)
  }

  const list = data ?? []
  const filtered = useMemo(() => {
    if (!search.trim()) return list
    return list.filter((o: Organizer) =>
      (o.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.user?.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.qualifications ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [list, search])

  return (
    <div>
      <PageHeader title="المنظمون" description="إدارة حسابات المنظمين.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن منظم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
        {isAdmin && (
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                منظم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>منظم جديد</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>الاسم الكامل</Label>
                  <Input value={addName} onChange={(e) => setAddName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>كلمة المرور</Label>
                  <Input type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>الهاتف</Label>
                  <Input type="tel" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>المؤهلات</Label>
                  <Input value={addQuals} onChange={(e) => setAddQuals(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
                <Button
                  onClick={() => createMutation.mutate({ name: addName, email: addEmail, password: addPassword, phone: addPhone || undefined, qualifications: addQuals || undefined })}
                  disabled={createMutation.isPending || !addName || !addEmail || !addPassword}
                >
                  {createMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  إنشاء
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "لا يوجد منظمون يطابقون بحثك." : "لم يتم العثور على منظمين."}</p>
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
                  <TableHead>الهاتف</TableHead>
                  <TableHead>المؤهلات</TableHead>
                  <TableHead>الحالة</TableHead>
                  {isAdmin && <TableHead className="w-32 text-center">الإجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o: Organizer) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.user?.name ?? "—"}</TableCell>
                    <TableCell>{o.user?.email ?? "—"}</TableCell>
                    <TableCell>{o.phone || "—"}</TableCell>
                    <TableCell>{o.qualifications ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={o.is_active ? "default" : "secondary"}>
                        {o.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Dialog open={editId === o.id} onOpenChange={(open) => { if (!open) setEditId(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(o)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader><DialogTitle>تعديل المنظم</DialogTitle></DialogHeader>
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
                                  <Label>المؤهلات</Label>
                                  <Input value={editQuals} onChange={(e) => setEditQuals(e.target.value)} />
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
                                  onClick={() => updateMutation.mutate({ id: o.id, data: { name: editName, email: editEmail, phone: editPhone || undefined, qualifications: editQuals || undefined, is_active: editIsActive } })}
                                  disabled={updateMutation.isPending}
                                >
                                  {updateMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                  حفظ
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={deleteId === o.id} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(o.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle>
                                <DialogDescription>هل أنت متأكد من حذف المنظم {o.user?.name}؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => deleteMutation.mutate(o.id)}
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
