import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Plus, Inbox, Pencil, Search } from "lucide-react"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { studentApi } from "@/services/api"
import type { Student } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_authenticated/students")({
  component: StudentsPage,
})

function StudentsPage() {
  const { isAdmin, isOrganizer, isTeacher } = useAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChildRoute = pathname !== "/students"
  const [search, setSearch] = useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentApi.list(),
  })

  const studentsList = data ?? []
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return studentsList
    return studentsList.filter((s: Student) =>
      (s.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.user?.email ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [studentsList, search])

  if (isChildRoute) return <Outlet />

  return (
    <div>
      <PageHeader title="Students" description="Manage student accounts and profiles.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        {(isAdmin || isOrganizer || isTeacher) && (
          <a href="/students/new" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Student
          </a>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "No students match your search." : "No students found."}</p>
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
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Class Enrollment</TableHead>
                  {(isAdmin || isOrganizer) && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s: Student) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.user?.name ?? "—"}</TableCell>
                    <TableCell>{s.user?.email ?? "—"}</TableCell>
                    <TableCell>{s.phone || s.user?.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? "default" : "secondary"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.enrollments && s.enrollments.length > 0
                        ? s.enrollments.map((e) => e.class?.name).join(", ")
                        : "—"}
                    </TableCell>
                    {(isAdmin || isOrganizer) && (
                      <TableCell>
                        <a href={`/students/${s.id}/edit`}>
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
