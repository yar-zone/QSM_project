import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  GraduationCap,
  Award,
  CalendarCheck,
  Video,
  BarChart3,
  ShieldCheck,
  Bell,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nur Quranic School — Memorization, Exams & Certificates" },
      {
        name: "description",
        content:
          "A complete Quranic school management platform: track Juz/Hizb memorization, schedule exams, issue certificates, manage attendance, meetings and announcements.",
      },
      { property: "og:title", content: "Nur Quranic School Management Platform" },
      {
        property: "og:description",
        content:
          "Track memorization, schedule exams, issue certificates and follow school analytics.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BookOpen, title: "Memorization Tracking", desc: "Follow Juz, Hizb and Surah progress with revision levels and scores." },
  { icon: GraduationCap, title: "Examinations", desc: "Book and manage 15, 30, 45 and 60 Hizb exams with committees and results." },
  { icon: Award, title: "Certificates", desc: "Auto-generate beautiful PDF certificates with QR verification." },
  { icon: CalendarCheck, title: "Attendance", desc: "Record presence, absences and excuses with rich analytics." },
  { icon: Video, title: "Online Meetings", desc: "Schedule and launch Jitsi meetings with students and parents." },
  { icon: BarChart3, title: "School Analytics", desc: "Line, bar and pie charts across students, classes and teachers." },
  { icon: Bell, title: "Announcements", desc: "General, exams, events, meetings and urgent notices." },
  { icon: ShieldCheck, title: "Role-based Access", desc: "Admin, Organizer, Teacher, Student and Parent — each with the right access." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-bold text-primary">Nur Quran</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" search={{ mode: "login" }}>
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/auth" search={{ mode: "register" }}>
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="pattern-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="font-display text-2xl text-secondary">بسم الله الرحمن الرحيم</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-5xl">
            A complete platform to manage your Quranic school
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Track memorization, run examinations, issue certificates, follow attendance and host
            meetings — all in one beautiful, secure place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "register" }}>
              <Button size="lg">Create your account</Button>
            </Link>
            <Link to="/auth" search={{ mode: "login" }}>
              <Button size="lg" variant="outline">I already have an account</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-foreground">Everything in one place</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Nur Quranic School. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
