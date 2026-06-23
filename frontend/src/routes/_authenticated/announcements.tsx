import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Inbox, Plus, Pin, PinOff, Search } from "lucide-react"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { announcementApi } from "@/services/api"
import type { Announcement } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

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
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/announcements"
  const [search, setSearch] = useState("")

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementApi.list(),
  })

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
      <PageHeader title="Announcements" description="View all announcements and notices.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {(isAdmin || isOrganizer || isTeacher) && <a href="/announcements/new"><Button><Plus className="mr-1 h-4 w-4" />New Announcement</Button></a>}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !announcements || announcements.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>No announcements found.</p>
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
                {a.category === "meetings" && a.meeting_link && (
                  <div className="rounded-md bg-primary/5 p-3 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1">Meeting Link</p>
                    <a href={a.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                      {a.meeting_link}
                    </a>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{a.author?.name ?? "Unknown"}</span>
                  <span>·</span>
                  <span>{new Date(a.published_at).toLocaleDateString()}</span>
                  {a.target_audience && (
                    <>
                      <span>·</span>
                      <AudienceBadge audience={a.target_audience} />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}