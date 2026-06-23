import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Inbox, Pencil, Trash2, Search } from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"

import { studentApi } from "@/services/api"
import type { Student } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export const Route = createFileRoute("/_authenticated/students")({
  component: StudentsPage,
})

function StudentsPage() {
  const { isAdmin, isOrganizer, isTeacher } = useAuth()
  const canManage = isAdmin || isOrganizer
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/students"
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentApi.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success("تم حذف الطالب")
      setDeleteId(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "فشل حذف الطالب"),
  })

  const studentsList = data ?? []
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return studentsList
    return studentsList.filter((s: Student) =>
      (s.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.user?.email ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [studentsList, search])

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="الطلاب" description="إدارة حسابات الطلاب وملفاتهم.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن طالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
        {(isAdmin || isOrganizer || isTeacher) && (
          <a href="/students/new" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            طالب جديد
          </a>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "لا يوجد طلاب يطابقون بحثك." : "لم يتم العثور على طلاب."}</p>
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
                  <TableHead>الحالة</TableHead>
                  <TableHead>التسجيل في الفصول</TableHead>
                    {canManage && <TableHead className="w-32 text-center">الإجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s: Student) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.user?.name ?? "—"}</TableCell>
                    <TableCell>{s.user?.email ?? "—"}</TableCell>
                    <TableCell>{s.phone || s.user?.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? "default" : "secondary"}>
                        {s.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.enrollments && s.enrollments.length > 0
                        ? s.enrollments.map((e) => e.class?.name).join(", ")
                        : "—"}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <a href={`/students/${s.id}/edit`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </a>
                          <Dialog open={deleteId === s.id} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle>
                                <DialogDescription>هل أنت متأكد من حذف الطالب {s.user?.name}؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => deleteMutation.mutate(s.id)}
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
