import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { Loader2, Inbox, Download, Plus, FileText, Search } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export const Route = createFileRoute("/_authenticated/certificates")({
  component: CertificatesPage,
})

function CertificatesPage() {
  const { isAdmin, isOrganizer, isTeacher } = useAuth()
  const canManage = isAdmin || isOrganizer || isTeacher
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [hizbCount, setHizbCount] = useState(1)
  const [grade, setGrade] = useState("")
  const [certType, setCertType] = useState("memorization")

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentApi.list(),
    enabled: showForm,
  })

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: () => certificateApi.list(),
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
      toast.success("Certificate generated")
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ["certificates"] })
      if (res?.data?.pdf) {
        downloadPdf(res.data.pdf, res.data.filename || "certificate.pdf")
      }
    },
    onError: () => toast.error("Failed to generate certificate"),
  })

  const downloadMutation = useMutation({
    mutationFn: (id: number) => certificateApi.download(id),
    onSuccess: (data: any) => {
      if (data?.pdf) downloadPdf(data.pdf, data.filename || "certificate.pdf")
    },
    onError: () => toast.error("Failed to download certificate"),
  })

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
    if (!studentName.trim()) { toast.error("Student name is required"); return }
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
      <PageHeader title="Certificates" description="View and generate certificates.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search certificates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" />Generate Certificate
          </Button>
        )}
      </PageHeader>

      {showForm && canManage && (
        <Card className="mb-6 shadow-[var(--shadow-card)]">
          <CardHeader><CardTitle>Generate New Certificate</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Student (optional)</Label>
              <Select value={selectedStudentId} onValueChange={(v) => {
                setSelectedStudentId(v)
                const s = students?.find(st => String(st.id) === v)
                if (s) setStudentName(s.user?.name ?? "")
              }}>
                <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                <SelectContent>
                  {students?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.user?.name ?? `Student #${s.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Student Name</Label>
              <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Hizb Count</Label>
                <Input type="number" min={1} value={hizbCount} onChange={e => setHizbCount(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Grade</Label>
                <Input value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. Excellent" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={certType} onValueChange={setCertType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="memorization">Memorization</SelectItem>
                    <SelectItem value="completion">Completion</SelectItem>
                    <SelectItem value="participation">Participation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileText className="mr-2 h-4 w-4" />Generate PDF
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
            <p>{search ? "No certificates match your search." : "No certificates found."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate Number</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Hizb Count</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Actions</TableHead>
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
                    <Badge variant={c.is_verified ? "default" : "secondary"}>{c.is_verified ? "Yes" : "No"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => downloadMutation.mutate(c.id)} disabled={downloadMutation.isPending}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
