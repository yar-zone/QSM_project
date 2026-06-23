import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Inbox, Plus, Search } from "lucide-react"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { attendanceApi } from "@/services/api"
import type { Attendance } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
})

function statusBadge(status: string) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive"; className: string }> = {
    present: { variant: "default", className: "" },
    absent: { variant: "destructive", className: "" },
    late: { variant: "secondary", className: "bg-amber-500 text-white hover:bg-amber-500/80" },
    excused: { variant: "default", className: "bg-blue-600 text-white hover:bg-blue-600/80" },
  }
  const s = map[status] ?? { variant: "secondary" as const, className: "" }
  return <Badge variant={s.variant} className={s.className}>{status}</Badge>
}

function AttendancePage() {
  const { isAdmin, isOrganizer, isTeacher, isStudent, isParent } = useAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/attendance"
  const [search, setSearch] = useState("")
  const { data: records, isLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: () => attendanceApi.list(),
  })

  const recordsList = records ?? []
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return recordsList
    return recordsList.filter((r: Attendance) =>
      (r.student?.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.class?.name ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [recordsList, search])

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="Attendance" description="View attendance records for all students.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search attendance..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {(isAdmin || isOrganizer || isTeacher) && <a href="/attendance/new"><Button><Plus className="mr-1 h-4 w-4" />New Attendance</Button></a>}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "No attendance records match your search." : "No attendance records found."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Marked By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((r: Attendance) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.student?.user?.name ?? `Student #${r.student_id}`}</TableCell>
                  <TableCell>{r.class?.name ?? `Class #${r.class_id}`}</TableCell>
                  <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell>{r.notes ?? "—"}</TableCell>
                  <TableCell>{r.markedBy?.name ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
