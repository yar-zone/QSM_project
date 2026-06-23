import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

import { studentApi, classApi } from "@/services/api"
import type { Classe } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export const Route = createFileRoute("/_authenticated/students/new")({
  component: NewStudentPage,
})

const schema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب").max(120),
  email: z.string().trim().min(1, "البريد الإلكتروني مطلوب").email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  password_confirmation: z.string().min(1, "تأكيد كلمة المرور"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  date_of_birth: z.string().trim().optional().or(z.literal("")),
  gender: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  emergency_contact: z.string().trim().optional().or(z.literal("")),
  enrollment_date: z.string().trim().optional().or(z.literal("")),
  class_ids: z.array(z.number()).optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["password_confirmation"],
})

type Values = z.infer<typeof schema>

function NewStudentPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", email: "", password: "", password_confirmation: "",
      phone: "", date_of_birth: "", gender: "",
      address: "", emergency_contact: "", enrollment_date: "",
    },
  })

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classApi.list(),
  })

  const selectedClasses = watch("class_ids") || []

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await studentApi.create({
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        role: "student",
        phone: values.phone || undefined,
        date_of_birth: values.date_of_birth || undefined,
        gender: values.gender || undefined,
        address: values.address || undefined,
        emergency_contact: values.emergency_contact || undefined,
        enrollment_date: values.enrollment_date || undefined,
        class_ids: values.class_ids || undefined,
      })
      toast.success("تم إنشاء الطالب")
      navigate({ to: "/students" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء الطالب")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="طالب جديد" description="إنشاء حساب طالب جديد.">
        <a href="/students">
          <Button variant="outline" size="sm" className="shadow-sm">
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </Button>
        </a>
      </PageHeader>
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>بيانات الطالب</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password_confirmation">تأكيد كلمة المرور</Label>
              <Input id="password_confirmation" type="password" {...register("password_confirmation")} />
              {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">الهاتف</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label>الفصول</Label>
              <p className="text-xs text-muted-foreground">اختر الفصول لتسجيل هذا الطالب.</p>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {(classes ?? []).map((c: Classe) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`class-${c.id}`}
                      checked={selectedClasses.includes(c.id)}
                      onCheckedChange={(checked) => {
                        const newVals = checked
                          ? [...selectedClasses, c.id]
                          : selectedClasses.filter((id: number) => id !== c.id)
                        setValue("class_ids", newVals)
                      }}
                    />
                    <Label htmlFor={`class-${c.id}`} className="text-sm font-normal">{c.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
              <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">الجنس</Label>
              <Input id="gender" {...register("gender")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">العنوان</Label>
              <Input id="address" {...register("address")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emergency_contact">جهة اتصال للطوارئ</Label>
              <Input id="emergency_contact" {...register("emergency_contact")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enrollment_date">تاريخ التسجيل</Label>
              <Input id="enrollment_date" type="date" {...register("enrollment_date")} />
            </div>
            <Button type="submit" disabled={saving} className="shadow-md hover:shadow-lg transition-shadow">
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء طالب
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}