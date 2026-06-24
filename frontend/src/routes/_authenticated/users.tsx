import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Inbox, Search, Eye } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"

import { useAuth } from "@/hooks/use-auth"

import { userApi } from "@/services/api"
import type { User } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ROLE_LABELS } from "@/lib/roles"

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
})

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "active") return "default"
  if (status === "inactive") return "destructive"
  return "secondary"
}

function UsersPage() {
  const { isAdmin, isOrganizer, user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => userApi.list(),
  })

  const approveMutation = useMutation({
    mutationFn: async (id: number) => { await userApi.approve(id); return id },
    onSuccess: () => { toast.success("تم اعتماد المستخدم"); queryClient.invalidateQueries({ queryKey: ["users"] }) },
    onError: () => toast.error("فشل اعتماد المستخدم"),
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => { await userApi.reject(id); return id },
    onSuccess: () => { toast.success("تم رفض المستخدم"); queryClient.invalidateQueries({ queryKey: ["users"] }) },
    onError: () => toast.error("فشل رفض المستخدم"),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => { await userApi.deactivate(id); return id },
    onSuccess: () => { toast.success("تم إلغاء تنشيط المستخدم"); queryClient.invalidateQueries({ queryKey: ["users"] }) },
    onError: () => toast.error("فشل إلغاء تنشيط المستخدم"),
  })

  const reactivateMutation = useMutation({
    mutationFn: async (id: number) => { await userApi.reactivate(id); return id },
    onSuccess: () => { toast.success("تم إعادة تنشيط المستخدم"); queryClient.invalidateQueries({ queryKey: ["users"] }) },
    onError: () => toast.error("فشل إعادة تنشيط المستخدم"),
  })

  const [infoUserId, setInfoUserId] = useState<number | null>(null)
  const [resetPwUserId, setResetPwUserId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("")

  const resetPwMutation = useMutation({
    mutationFn: ({ id, password, password_confirmation }: { id: number; password: string; password_confirmation: string }) =>
      userApi.resetPassword(id, { password, password_confirmation }),
    onSuccess: () => {
      toast.success("تم إعادة تعيين كلمة المرور")
      setResetPwUserId(null)
      setNewPassword("")
      setNewPasswordConfirmation("")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "فشل إعادة تعيين كلمة المرور"),
  })

  const userList = users ?? []
  const filteredUsers = useMemo(() => {
    let list = userList
    if (currentUser) list = list.filter((u: User) => u.id !== currentUser.id)
    if (!search.trim()) return list
    return list.filter((u: User) =>
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.role ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [userList, search, currentUser])

  return (
    <div>
      <PageHeader title="المستخدمون" description="إدارة جميع المستخدمين في النظام.">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن مستخدم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{search ? "لا يوجد مستخدمون يطابقون بحثك." : "لم يتم العثور على مستخدمين."}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-[var(--shadow-card)] overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>آخر تسجيل دخول</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: User) => (
                  <TableRow key={user.id} className="transition-colors hover:bg-accent/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {(user.name || user.email).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell><Badge variant="outline">{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}</Badge></TableCell>
                    <TableCell><Badge variant={statusVariant(user.status)}>{user.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center gap-1">
                        {(isAdmin || isOrganizer) && (
                          <>
                            <Dialog open={infoUserId === user.id} onOpenChange={(open) => { if (!open) setInfoUserId(null); }}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setInfoUserId(user.id)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader><DialogTitle>معلومات المستخدم</DialogTitle>
                                  <DialogDescription>تفاصيل حساب {user.name}.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 py-2">
                                  <div className="flex justify-between"><span className="text-muted-foreground">الاسم:</span><span className="font-medium">{user.name}</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">البريد الإلكتروني:</span><span>{user.email}</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">الهاتف:</span><span>{user.phone || "—"}</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">الدور:</span><Badge variant="outline">{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}</Badge></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">الحالة:</span><Badge variant={statusVariant(user.status)}>{user.status}</Badge></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">آخر تسجيل دخول:</span><span>{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "—"}</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">تاريخ الإنشاء:</span><span>{new Date(user.created_at).toLocaleDateString()}</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">كلمة المرور:</span><span dir="ltr" className="font-mono text-sm">{user.plain_password || "—"}</span></div>
                                  <hr />
                                  <div className="space-y-2">
                                    <Label className="text-base font-semibold">إعادة تعيين كلمة المرور</Label>
                                    <Input type="password" placeholder="كلمة المرور الجديدة" value={resetPwUserId === user.id ? newPassword : ""} onChange={(e) => { setResetPwUserId(user.id); setNewPassword(e.target.value); }} />
                                    <Input type="password" placeholder="تأكيد كلمة المرور" value={resetPwUserId === user.id ? newPasswordConfirmation : ""} onChange={(e) => { setResetPwUserId(user.id); setNewPasswordConfirmation(e.target.value); }} />
                                    {resetPwUserId === user.id && newPassword && newPasswordConfirmation && newPassword !== newPasswordConfirmation && (
                                      <p className="text-xs text-destructive">كلمة المرور غير متطابقة</p>
                                    )}
                                    <Button
                                      size="sm"
                                      disabled={!newPassword || newPassword.length < 8 || newPassword !== newPasswordConfirmation || resetPwMutation.isPending}
                                      onClick={() => resetPwMutation.mutate({ id: user.id, password: newPassword, password_confirmation: newPasswordConfirmation })}
                                    >
                                      {resetPwMutation.isPending ? <Loader2 className="ml-2 h-3 w-3 animate-spin" /> : null}
                                      حفظ كلمة المرور الجديدة
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                        {user.status === "pending" && (isAdmin || isOrganizer) && (
                          <div className="flex justify-start gap-1">
                            <Button size="sm" variant="outline" disabled={rejectMutation.isPending} onClick={() => rejectMutation.mutate(user.id)}>
                              {rejectMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              رفض
                            </Button>
                            <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(user.id)}>
                              {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              اعتماد
                            </Button>
                          </div>
                        )}
                        {user.status === "active" && (isAdmin || isOrganizer) && (
                          <div className="flex justify-start gap-1">
                            <Button size="sm" variant="outline" disabled={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(user.id)}>
                              {deactivateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              إلغاء تنشيط
                            </Button>
                          </div>
                        )}
                        {user.status === "inactive" && (isAdmin || isOrganizer) && (
                          <div className="flex justify-start gap-1">
                            <Button size="sm" disabled={reactivateMutation.isPending} onClick={() => reactivateMutation.mutate(user.id)}>
                              {reactivateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              إعادة تنشيط
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
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