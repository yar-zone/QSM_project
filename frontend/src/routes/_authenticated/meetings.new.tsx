import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

import { meetingApi, classApi, teacherApi, organizerApi } from "@/services/api"
import type { Classe, Teacher, Organizer } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional().or(z.literal("")),
  platform: z.string({ required_error: "Select a platform" }),
  meeting_link: z.string().optional().or(z.literal("")),
  scheduled_at: z.string().min(1, "Date and time is required"),
  duration_minutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  target_classes: z.array(z.number()).optional(),
  target_teachers: z.array(z.number()).optional(),
  target_organizers: z.array(z.number()).optional(),
})
type Values = z.infer<typeof schema>

export const Route = createFileRoute("/_authenticated/meetings/new")({
  component: NewMeetingPage,
})

function NewMeetingPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { duration_minutes: 60, platform: "Jitsi" },
  })

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classApi.list(),
  })

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teacherApi.list(),
  })

  const { data: organizers } = useQuery({
    queryKey: ["organizers"],
    queryFn: () => organizerApi.list(),
  })

  const selectedClasses = watch("target_classes") || []
  const selectedTeachers = watch("target_teachers") || []
  const selectedOrganizers = watch("target_organizers") || []

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      await meetingApi.create({
        ...values,
        target_classes: values.target_classes || undefined,
        target_teachers: values.target_teachers || undefined,
        target_organizers: values.target_organizers || undefined,
      })
      toast.success("Meeting created")
      navigate({ to: "/meetings" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create meeting")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="New Meeting" description="Schedule a new meeting." />
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader><CardTitle>Meeting Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} {...register("description")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="platform">Platform</Label>
              <Select onValueChange={(v) => setValue("platform", v)} defaultValue="Jitsi">
                <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jitsi">Jitsi</SelectItem>
                  <SelectItem value="Zoom">Zoom</SelectItem>
                  <SelectItem value="Google Meet">Google Meet</SelectItem>
                </SelectContent>
              </Select>
              {errors.platform && <p className="text-xs text-destructive">{errors.platform.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meeting_link">Meeting Link</Label>
              <Input id="meeting_link" type="url" {...register("meeting_link")} placeholder="https://meet.google.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduled_at">Scheduled At</Label>
              <Input id="scheduled_at" type="datetime-local" {...register("scheduled_at")} />
              {errors.scheduled_at && <p className="text-xs text-destructive">{errors.scheduled_at.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input id="duration_minutes" type="number" min={1} {...register("duration_minutes")} />
              {errors.duration_minutes && <p className="text-xs text-destructive">{errors.duration_minutes.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Target Classes</Label>
              <p className="text-xs text-muted-foreground">Select classes that will see this meeting.</p>
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
                        setValue("target_classes", newVals)
                      }}
                    />
                    <Label htmlFor={`class-${c.id}`} className="text-sm font-normal">{c.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Teachers</Label>
              <p className="text-xs text-muted-foreground">Select teachers that will see this meeting.</p>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {(teachers ?? []).map((t: Teacher) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`teacher-${t.id}`}
                      checked={selectedTeachers.includes(t.id)}
                      onCheckedChange={(checked) => {
                        const newVals = checked
                          ? [...selectedTeachers, t.id]
                          : selectedTeachers.filter((id: number) => id !== t.id)
                        setValue("target_teachers", newVals)
                      }}
                    />
                    <Label htmlFor={`teacher-${t.id}`} className="text-sm font-normal">{t.user?.name ?? `Teacher #${t.id}`}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Organizers</Label>
              <p className="text-xs text-muted-foreground">Select organizers that will see this meeting.</p>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {(organizers ?? []).map((o: Organizer) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`organizer-${o.id}`}
                      checked={selectedOrganizers.includes(o.id)}
                      onCheckedChange={(checked) => {
                        const newVals = checked
                          ? [...selectedOrganizers, o.id]
                          : selectedOrganizers.filter((id: number) => id !== o.id)
                        setValue("target_organizers", newVals)
                      }}
                    />
                    <Label htmlFor={`organizer-${o.id}`} className="text-sm font-normal">{o.user?.name ?? `Organizer #${o.id}`}</Label>
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Meeting
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}