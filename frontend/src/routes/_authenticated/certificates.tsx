import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { Loader2, Inbox, Download, Plus, Pencil, Trash2, FileText, Search } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"
import { certificateApi, studentApi } from "@/services/api"
import type { Certificate } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export const Route = createFileRoute("/_authenticated/certificates")({
  component: CertificatesPage,
})

function CertificatesPage() {
  const { isAdmin, isOrganizer, isTeacher, isStudent, isParent } = useAuth()
  const canManage = isAdmin || isOrganizer || isTeacher
  const isStudentOrParent = isStudent || isParent
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [hizbCount, setHizbCount] = useState(1)
  const [grade, setGrade] = useState("")
  const [certType, setCertType] = useState("memorization")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ student_name: "", hizb_count: "", grade: "", certificate_type: "", is_verified: false })

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentApi.list(),
    enabled: showForm,
  })

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["certificates", isStudentOrParent ? "my" : "all"],
    queryFn: () => isStudentOrParent ? certificateApi.myList() : certificateApi.list(),
  })

  const certificatesList = certificates ?? []
  const filteredCertificates = useMemo(() => {
    if (!search.trim()) return certificatesList
    return certificatesList.filter((c: Certificate) =>
      (c.student?.user?.name ?? c.student_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.certificate_number ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [certificatesList, search])

  const generateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => certificateApi.generatePdf(data),
    onSuccess: (res: any) => {
      toast.success("تم إنشاء الشهادة")
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ["certificates", "all"] }); queryClient.invalidateQueries({ queryKey: ["certificates", "my"] })
      if (res?.data?.pdf) {
        downloadPdf(res.data.pdf, res.data.filename || "certificate.pdf")
      }
    },
    onError: () => toast.error("فشل إنشاء الشهادة"),
  })

  const downloadMutation = useMutation({
    mutationFn: (id: number) => certificateApi.download(id),
    onSuccess: (data: any) => {
      if (data?.pdf) downloadPdf(data.pdf, data.filename || "certificate.pdf")
    },
    onError: () => toast.error("فشل تحميل الشهادة"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => certificateApi.delete(id),
    onSuccess: () => { toast.success("تم حذف الشهادة"); queryClient.invalidateQueries({ queryKey: ["certificates", "all"] }); queryClient.invalidateQueries({ queryKey: ["certificates", "my"] }); setDeleteId(null) },
    onError: () => toast.error("فشل حذف الشهادة"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Certificate> }) => certificateApi.update(id, data),
    onSuccess: () => { toast.success("تم تحديث الشهادة"); queryClient.invalidateQueries({ queryKey: ["certificates", "all"] }); queryClient.invalidateQueries({ queryKey: ["certificates", "my"] }); setEditId(null) },
    onError: () => toast.error("فشل تحديث الشهادة"),
  })

  function openEdit(c: Certificate) {
    setEditForm({
      student_name: c.student_name ?? "",
      hizb_count: c.hizb_count?.toString() ?? "",
      grade: c.grade ?? "",
      certificate_type: c.certificate_type ?? "memorization",
      is_verified: c.is_verified,
    })
    setEditId(c.id)
  }

  function downloadPdf(base64: string, filename: string) {
    const byteChars = atob(base64)
    const byteNums = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
    const byteArray = new Uint8Array(byteNums)
    const blob = new Blob([byteArray], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleGenerate() {
    if (!studentName.trim()) { toast.error("اسم الطالب مطلوب"); return }
    generateMutation.mutate({
      student_name: studentName.trim(),
      hizb_count: hizbCount,
      grade,
      certificate_type: certType,
      student_id: selectedStudentId ? Number(selectedStudentId) : undefined,
    })
  }

  return (
    <div>
      <PageHeader title="الشهادات" description="عرض وإنشاء الشهادات.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن شهادة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="ml-1 h-4 w-4" />إنشاء شهادة
          </Button>
        )}
      </PageHeader>

      {showForm && canManage && (
        <Card className="mb-6 shadow-[var(--shadow-card)]">
          <CardHeader><CardTitle>إنشاء شهادة جديدة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>الطالب (اختياري)</Label>
              <Select value={selectedStudentId} onValueChange={(v) => {
                setSelectedStudentId(v)
                const s = students?.find(st => String(st.id) === v)
                if (s) setStudentName(s.user?.name ?? "")
              }}>
                <SelectTrigger><SelectValue placeholder="اختر طالباً" /></SelectTrigger>
                <SelectContent>
                  {students?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.user?.name ?? `Student #${s.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>اسم الطالب</Label>
              <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="الاسم الكامل" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>عدد الأحزاب</Label>
                <Input type="number" min={1} value={hizbCount} onChange={e => setHizbCount(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>التقدير</Label>
                <Input value={grade} onChange={e => setGrade(e.target.value)} placeholder="مثال: ممتاز" />
              </div>
              <div className="space-y-1.5">
                <Label>النوع</Label>
                <Select value={certType} onValueChange={setCertType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="memorization">حفظ</SelectItem>
                    <SelectItem value="completion">إتمام</SelectItem>
                    <SelectItem value="participation">مشاركة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              <FileText className="ml-2 h-4 w-4" />إنشاء PDF
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "لا توجد شهادات تطابق بحثك." : "لم يتم العثور على شهادات."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الشهادة</TableHead>
                <TableHead>الطالب</TableHead>
                <TableHead>عدد الأحزاب</TableHead>
                <TableHead>التقدير</TableHead>
                <TableHead>تاريخ الإصدار</TableHead>
                <TableHead>موثقة</TableHead>
                {canManage && <TableHead className="w-28 text-center">الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCertificates.map((c: Certificate) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.certificate_number}</TableCell>
                  <TableCell className="font-medium">{c.student?.user?.name ?? c.student_name}</TableCell>
                  <TableCell>{c.hizb_count}</TableCell>
                  <TableCell>{c.grade ?? "—"}</TableCell>
                  <TableCell>{new Date(c.issued_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_verified ? "default" : "secondary"}>{c.is_verified ? "نعم" : "لا"}</Badge>
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => downloadMutation.mutate(c.id)} disabled={downloadMutation.isPending}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Dialog open={editId === c.id} onOpenChange={(open) => { if (!open) setEditId(null); }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>تعديل الشهادة</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="space-y-1.5">
                                <Label>اسم الطالب</Label>
                                <Input value={editForm.student_name} onChange={(e) => setEditForm(f => ({ ...f, student_name: e.target.value }))} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label>عدد الأحزاب</Label>
                                  <Input type="number" min={1} value={editForm.hizb_count} onChange={(e) => setEditForm(f => ({ ...f, hizb_count: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>التقدير</Label>
                                  <Input value={editForm.grade} onChange={(e) => setEditForm(f => ({ ...f, grade: e.target.value }))} />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label>النوع</Label>
                                <Select value={editForm.certificate_type} onValueChange={(v) => setEditForm(f => ({ ...f, certificate_type: v }))}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="memorization">حفظ</SelectItem>
                                    <SelectItem value="completion">إتمام</SelectItem>
                                    <SelectItem value="participation">مشاركة</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox id="edit_is_verified" checked={editForm.is_verified} onCheckedChange={(v) => setEditForm(f => ({ ...f, is_verified: v === true }))} />
                                <Label htmlFor="edit_is_verified">موثقة</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditId(null)}>إلغاء</Button>
                              <Button
                                onClick={() => updateMutation.mutate({ id: c.id, data: { student_name: editForm.student_name || undefined, hizb_count: Number(editForm.hizb_count), grade: editForm.grade || undefined, certificate_type: editForm.certificate_type, is_verified: editForm.is_verified } })}
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
                              <DialogDescription>هل أنت متأكد من حذف الشهادة {c.certificate_number} للطالب {c.student?.user?.name ?? c.student_name}؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
                              <Button variant="destructive" onClick={() => deleteMutation.mutate(c.id)} disabled={deleteMutation.isPending}>
                                {deleteMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                حذف
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  ) : (
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => downloadMutation.mutate(c.id)} disabled={downloadMutation.isPending}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
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
