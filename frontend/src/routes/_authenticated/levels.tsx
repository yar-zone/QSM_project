import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Inbox, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { levelApi } from "@/services/api"
import type { Level } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export const Route = createFileRoute("/_authenticated/levels")({
  component: LevelsPage,
})

function LevelsPage() {
  const { isAdmin, isOrganizer } = useAuth()
  const canManage = isAdmin || isOrganizer
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/levels"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: levels, isLoading } = useQuery({
    queryKey: ["levels"],
    queryFn: levelApi.list,
  })

  const levelsList = levels ?? []
  const filteredLevels = useMemo(() => {
    if (!search.trim()) return levelsList
    return levelsList.filter((l: Level) =>
      (l.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.description ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [levelsList, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => levelApi.delete(id),
    onSuccess: () => {
      toast.success("تم حذف المستوى")
      queryClient.invalidateQueries({ queryKey: ["levels"] })
      setDeleteId(null)
    },
    onError: () => toast.error("فشل حذف المستوى"),
  })

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="المستويات" description="إدارة المستويات الدراسية.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن مستوى..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
        {(isAdmin || isOrganizer) && (
          <a href="/levels/new">
            <Button>
              <Plus className="h-4 w-4" />
              مستوى جديد
            </Button>
          </a>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredLevels.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "لا يوجد مستويات تطابق بحثك." : "لم يتم العثور على مستويات."}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الترتيب</TableHead>
                  <TableHead>الحالة</TableHead>
                  {canManage && <TableHead className="w-32 text-center">الإجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLevels.map((l: Level) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.description ?? "—"}</TableCell>
                    <TableCell>{l.order}</TableCell>
                    <TableCell>
                      <Badge variant={l.is_active ? "default" : "secondary"}>
                        {l.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <a href={`/levels/${l.id}/edit`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </a>
                          <Dialog open={deleteId === l.id} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(l.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle>
                                <DialogDescription>هل أنت متأكد من حذف المستوى {l.name}؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => deleteMutation.mutate(l.id)}
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
