import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Plus, Inbox, Pencil, Search } from "lucide-react"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { teacherApi } from "@/services/api"
import type { Teacher } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_authenticated/teachers")({
  component: TeachersPage,
})

function TeachersPage() {
  const { isAdmin, isOrganizer } = useAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/teachers"
  const [search, setSearch] = useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teacherApi.list(),
  })

  const teachersList = data ?? []
  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachersList
    return teachersList.filter((t: Teacher) =>
      (t.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.user?.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.qualification ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [teachersList, search])

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="Teachers" description="Manage teacher accounts and profiles.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {(isAdmin || isOrganizer) && (
          <a href="/teachers/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Teacher
            </Button>
          </a>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredTeachers.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "No teachers match your search." : "No teachers found."}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Status</TableHead>
                  {(isAdmin || isOrganizer) && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((t: Teacher) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.user?.name ?? "—"}</TableCell>
                    <TableCell>{t.user?.email ?? "—"}</TableCell>
                    <TableCell>{t.qualification ?? "—"}</TableCell>
                    <TableCell>{t.specialization ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? "default" : "secondary"}>
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {(isAdmin || isOrganizer) && (
                      <TableCell>
                        <a href={`/teachers/${t.id}/edit`}>
                          <Button variant="outline" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </a>
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
