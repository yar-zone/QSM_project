import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Inbox, Plus, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { memorizationApi } from "@/services/api"
import type { MemorizationTracking } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_authenticated/memorizations")({
  component: MemorizationsPage,
})

function MemorizationsPage() {
  const { isAdmin, isOrganizer, isTeacher, isStudent, isParent } = useAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/memorizations"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  const { data: memorizations, isLoading } = useQuery({
    queryKey: ["memorizations"],
    queryFn: () => memorizationApi.list(),
  })

  const memorizationsList = memorizations ?? []
  const filteredMemorizations = useMemo(() => {
    if (!search.trim()) return memorizationsList
    return memorizationsList.filter((m: MemorizationTracking) =>
      (m.student?.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (m.surah?.name ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [memorizationsList, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => memorizationApi.delete(id),
    onSuccess: () => { toast.success("Memorization record deleted"); queryClient.invalidateQueries({ queryKey: ["memorizations"] }) },
    onError: () => toast.error("Failed to delete record"),
  })

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="Memorization Tracking" description="Track student memorization progress.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search memorization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {(isAdmin || isOrganizer || isTeacher) && <a href="/memorizations/new"><Button><Plus className="mr-1 h-4 w-4" />New Record</Button></a>}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredMemorizations.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "No memorization records match your search." : "No memorization records found."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Surah / Juz / Hizb</TableHead>
                <TableHead>Verses Memorized</TableHead>
                <TableHead>Revision Level</TableHead>
                <TableHead>Performance Score</TableHead>
                {(isAdmin || isOrganizer || isTeacher) && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMemorizations.map((m: MemorizationTracking) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.student?.user?.name ?? `Student #${m.student_id}`}</TableCell>
                  <TableCell>{m.teacher?.user?.name ?? `Teacher #${m.teacher_id}`}</TableCell>
                  <TableCell>{[m.surah?.name, m.juz ? `Juz ${m.juz}` : "", m.hizb ? `Hizb ${m.hizb}` : ""].filter(Boolean).join(" / ") || "—"}</TableCell>
                  <TableCell>{m.verses_memorized}</TableCell>
                  <TableCell><Badge variant="outline">{m.revision_level ?? "—"}</Badge></TableCell>
                  <TableCell>{m.performance_score ?? "—"}</TableCell>
                  {(isAdmin || isOrganizer || isTeacher) && (
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
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
