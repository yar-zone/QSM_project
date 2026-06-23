import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Inbox, Plus, Search } from "lucide-react"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { examResultApi } from "@/services/api"
import type { ExamResult } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_authenticated/exam-results")({
  component: ExamResultsPage,
})

function ExamResultsPage() {
  const { isAdmin, isOrganizer, isTeacher, isStudent, isParent } = useAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/exam-results"
  const [search, setSearch] = useState("")
  const { data: results, isLoading } = useQuery({
    queryKey: ["exam-results"],
    queryFn: () => examResultApi.list(),
  })

  const resultsList = results ?? []
  const filteredResults = useMemo(() => {
    if (!search.trim()) return resultsList
    return resultsList.filter((r: ExamResult) =>
      (r.exam_request?.student?.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.grade ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [resultsList, search])

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="Exam Results" description="View all exam results and evaluations.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exam results..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {isAdmin || isOrganizer || isTeacher ? (
          <a href="/exam-results/new"><Button><Plus className="mr-1 h-4 w-4" />New Result</Button></a>
        ) : (
          <Badge variant="outline">View Only</Badge>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredResults.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "No exam results match your search." : "No exam results found."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Exam (Hizb)</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Passed/Failed</TableHead>
                <TableHead>Evaluated By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((r: ExamResult) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.exam_request?.student?.user?.name ?? `Student #${r.exam_request?.student_id}`}</TableCell>
                  <TableCell>{r.exam_request?.hizb_count ?? "—"} hizb</TableCell>
                  <TableCell>{r.marks_obtained ?? "—"}</TableCell>
                  <TableCell>{r.grade ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.is_passed ? "default" : "destructive"}>{r.is_passed ? "Passed" : "Failed"}</Badge>
                  </TableCell>
                  <TableCell>{r.evaluator?.name ?? "—"}</TableCell>
                  <TableCell>{r.evaluated_at ? new Date(r.evaluated_at).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
