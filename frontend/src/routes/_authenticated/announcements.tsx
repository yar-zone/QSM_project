import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Inbox, Plus, Pencil, Trash2, Pin, PinOff, Search, Video, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { announcementApi } from "@/services/api"
import type { Announcement } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export const Route = createFileRoute("/_authenticated/announcements")({
  component: AnnouncementsPage,
})

function AudienceBadge({ audience }: { audience: string }) {
  if (!audience) return null
  const roles = audience.split(",").map((a) => a.trim())
  const colors: Record<string, string> = {
    admin: "bg-blue-500 text-white",
    organizer: "bg-green-500 text-white",
    teacher: "bg-amber-500 text-white",
    student: "bg-purple-500 text-white",
    parent: "bg-pink-500 text-white",
    all: "bg-primary text-primary-foreground",
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role} variant="outline" className={`text-xs ${colors[role] || ""}`}>
          {role}
        </Badge>
      ))}
    </div>
  )
}

function categoryBadge(category: string) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    general: { variant: "secondary", className: "" },
    exams: { variant: "default", className: "" },
    events: { variant: "default", className: "bg-purple-600 text-white hover:bg-purple-600/80" },
    meetings: { variant: "outline", className: "" },
    urgent: { variant: "destructive", className: "" },
  }
  const b = map[category] ?? { variant: "secondary" as const, className: "" }
  return <Badge variant={b.variant} className={b.className}>{category}</Badge>
}

function AnnouncementsPage() {
  const { isAdmin, isOrganizer, isTeacher } = useAuth()
  const canManage = isAdmin || isOrganizer || isTeacher
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/announcements"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ title: "", content: "", category: "", is_pinned: false })

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementApi.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => announcementApi.delete(id),
    onSuccess: () => { toast.success("تم حذف الإعلان"); queryClient.invalidateQueries({ queryKey: ["announcements"] }); setDeleteId(null) },
    onError: () => toast.error("فشل حذف الإعلان"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Announcement> }) => announcementApi.update(id, data),
    onSuccess: () => { toast.success("تم تحديث الإعلان"); queryClient.invalidateQueries({ queryKey: ["announcements"] }); setEditId(null) },
    onError: () => toast.error("فشل تحديث الإعلان"),
  })

  function openEdit(a: Announcement) {
    setEditForm({ title: a.title, content: a.content, category: a.category, is_pinned: a.is_pinned })
    setEditId(a.id)
  }

  if (isChildRoute) return <Outlet />

  const announcementsList = announcements ?? []
  const filtered = useMemo(() => {
    if (!search.trim()) return announcementsList
    return announcementsList.filter((a: Announcement) =>
      (a.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.content ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.category ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [announcementsList, search])

  const sorted = filtered.slice().sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })

  return (
    <div>
      <PageHeader title="الإعلانات" description="عرض جميع الإعلانات والتنبيهات.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن إعلان..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
        {(isAdmin || isOrganizer || isTeacher) && <a href="/announcements/new"><Button><Plus className="ml-1 h-4 w-4" />إعلان جديد</Button></a>}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !announcements || announcements.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>لم يتم العثور على إعلانات.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((a: Announcement) => (
            <Card key={a.id} className={`shadow-[var(--shadow-card)] ${a.is_pinned ? "border-primary/40" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {a.is_pinned && <Pin className="h-4 w-4 text-primary shrink-0" />}
                    <CardTitle className="text-lg">{a.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.is_pinned && <PinOff className="h-3 w-3 text-muted-foreground" />}
                    {categoryBadge(a.category)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">{a.content}</p>
                {a.meeting_link && (
                  <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/[0.04] to-transparent p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Video className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">تفاصيل الاجتماع</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">انقر على الرابط أدناه للانضمام إلى الاجتماع</p>
                        <a
                          href={a.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          انضمام إلى الاجتماع
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{a.author?.name ?? "غير معروف"}</span>
                  <span>·</span>
                  <span>{new Date(a.published_at).toLocaleDateString()}</span>
                  {a.target_audience && (
                    <>
                      <span>·</span>
                      <AudienceBadge audience={a.target_audience} />
                    </>
                  )}
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 pt-2 border-t mt-3">
                    <Dialog open={editId === a.id} onOpenChange={(open) => { if (!open) setEditId(null); }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                          <Pencil className="h-3.5 w-3.5 ml-1" />تعديل
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>تعديل الإعلان</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-1.5">
                            <Label>العنوان</Label>
                            <Input value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>المحتوى</Label>
                            <Textarea rows={4} value={editForm.content} onChange={(e) => setEditForm(f => ({ ...f, content: e.target.value }))} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label>التصنيف</Label>
                              <Select value={editForm.category} onValueChange={(v) => setEditForm(f => ({ ...f, category: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="general">عام</SelectItem>
                                  <SelectItem value="exams">امتحانات</SelectItem>
                                  <SelectItem value="events">أحداث</SelectItem>
                                  <SelectItem value="meetings">اجتماعات</SelectItem>
                                  <SelectItem value="urgent">عاجل</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                              <input type="checkbox" id="edit_is_pinned" checked={editForm.is_pinned} onChange={(e) => setEditForm(f => ({ ...f, is_pinned: e.target.checked }))} className="h-4 w-4" />
                              <Label htmlFor="edit_is_pinned">مثبت</Label>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditId(null)}>إلغاء</Button>
                          <Button onClick={() => updateMutation.mutate({ id: a.id, data: { title: editForm.title, content: editForm.content, category: editForm.category, is_pinned: editForm.is_pinned } })} disabled={updateMutation.isPending}>
                            {updateMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            حفظ
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={deleteId === a.id} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(a.id)}>
                          <Trash2 className="h-3.5 w-3.5 ml-1 text-red-500" />حذف
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle>
                          <DialogDescription>هل أنت متأكد من حذف الإعلان "{a.title}"؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
                          <Button variant="destructive" onClick={() => deleteMutation.mutate(a.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            حذف
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}