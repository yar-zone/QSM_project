import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Inbox, Plus, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { meetingApi } from "@/services/api"
import type { Meeting } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_authenticated/meetings")({
  component: MeetingsPage,
})

function statusBadge(status: string) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    scheduled: { variant: "secondary", className: "" },
    ongoing: { variant: "default", className: "bg-green-600 text-white hover:bg-green-600/80" },
    completed: { variant: "outline", className: "" },
    cancelled: { variant: "destructive", className: "" },
  }
  const s = map[status] ?? { variant: "secondary" as const, className: "" }
  return <Badge variant={s.variant} className={s.className}>{status}</Badge>
}

function MeetingsPage() {
  const { isAdmin, isOrganizer, isTeacher, isStudent, isParent } = useAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/meetings"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => meetingApi.list(),
  })

  const meetingsList = meetings ?? []
  const filteredMeetings = useMemo(() => {
    if (!search.trim()) return meetingsList
    return meetingsList.filter((m: Meeting) =>
      (m.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (m.platform ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [meetingsList, search])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => meetingApi.delete(id),
    onSuccess: () => { toast.success("Meeting deleted"); queryClient.invalidateQueries({ queryKey: ["meetings"] }) },
    onError: () => toast.error("Failed to delete meeting"),
  })

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="Meetings" description="View and manage scheduled meetings.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {(isAdmin || isOrganizer || isTeacher) && <a href="/meetings/new"><Button><Plus className="mr-1 h-4 w-4" />New Meeting</Button></a>}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "No meetings match your search." : "No meetings found."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Scheduled At</TableHead>
                <TableHead>Duration (min)</TableHead>
                <TableHead>Status</TableHead>
                {(isAdmin || isOrganizer || isTeacher) && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.map((m: Meeting) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.title}</TableCell>
                  <TableCell>{m.platform}</TableCell>
                  <TableCell>{new Date(m.scheduled_at).toLocaleString()}</TableCell>
                  <TableCell>{m.duration_minutes}</TableCell>
                  <TableCell>{statusBadge(m.status)}</TableCell>
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
