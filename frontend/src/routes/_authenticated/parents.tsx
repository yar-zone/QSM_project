import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Inbox, Trash2, Pencil, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { parentApi } from "@/services/api"
import type { User } from "@/types"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export const Route = createFileRoute("/_authenticated/parents")({
  component: ParentsPage,
})

function ParentsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/parents"
  const { isAdmin, isOrganizer } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["parents"],
    queryFn: () => parentApi.list(),
  })

  const parentsList = data ?? []
  const filteredParents = useMemo(() => {
    if (!search.trim()) return parentsList
    return parentsList.filter((p: User) =>
      (p.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [parentsList, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => parentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] })
      toast.success("تم حذف ولي الأمر")
      setDeleteId(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "فشل حذف ولي الأمر")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => parentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] })
      toast.success("تم تحديث ولي الأمر")
      setEditId(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "فشل تحديث ولي الأمر")
    },
  })

  function openEdit(parent: User) {
    setEditName(parent.name ?? "")
    setEditEmail(parent.email ?? "")
    setEditPhone(parent.phone ?? "")
    setEditId(parent.id)
  }

  if (isChildRoute) return <Outlet />

  const canManage = isAdmin || isOrganizer

  return (
    <div>
      <PageHeader title="أولياء الأمور" description="إدارة حسابات أولياء الأمور وملفاتهم.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن ولي أمر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
        {canManage && (
          <a href="/parents/new">
            <Button>
              <Plus className="h-4 w-4" />
              ولي أمر جديد
            </Button>
          </a>
        )}
      </PageHeader>

      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filteredParents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground">
            <Inbox className="h-7 w-7" />
          </span>
          <div>
            <p className="text-base font-medium text-foreground">{search ? "لا توجد نتائج" : "لم يتم العثور على أولياء أمور"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{search ? "لا يوجد أولياء أمور يطابقون بحثك." : "أنشئ حساب ولي أمر للبدء."}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border shadow-[var(--shadow-card)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الأبناء</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الحالة</TableHead>
                  <TableHead className="w-24">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParents.map((parent: User) => {
                const childrenCount = (parent as any).parent_students?.length ?? 0
                const initials = (parent.name || parent.email).slice(0, 2).toUpperCase()
                return (
                  <TableRow key={parent.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{parent.name ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{parent.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{childrenCount}</Badge>
                    </TableCell>
                    <TableCell>{parent.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={parent.is_active ? "default" : "secondary"}>
                        {parent.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Dialog open={editId === parent.id} onOpenChange={(open) => { if (!open) setEditId(null); }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(parent)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>تعديل ولي الأمر</DialogTitle></DialogHeader>
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
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditId(null)}>إلغاء</Button>
                              <Button
                                onClick={() => updateMutation.mutate({ id: parent.id, data: { name: editName, email: editEmail, phone: editPhone || undefined } })}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                حفظ
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={deleteId === parent.id} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(parent.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle>
                              <DialogDescription>هل أنت متأكد من حذف ولي الأمر {parent.name}؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
                              <Button
                                variant="destructive"
                                onClick={() => deleteMutation.mutate(parent.id)}
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
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
