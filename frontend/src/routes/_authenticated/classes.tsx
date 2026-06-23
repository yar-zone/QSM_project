import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Inbox, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { classApi } from "@/services/api"
import type { Classe } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
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

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: classApi.list,
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
                          <a href={`/classes/${c.id}/edit`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </a>
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
