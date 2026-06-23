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
      { title: "نور القرآن — الحفظ والامتحانات والشهادات" },
      {
        name: "description",
        content:
          "منصة متكاملة لإدارة المدارس القرآنية: تتبع حفظ الأجزاء والأحزاب، جدولة الامتحانات، إصدار الشهادات، إدارة الحضور والاجتماعات والإعلانات.",
      },
      { property: "og:title", content: "منصة إدارة مدارس نور القرآن" },
      {
        property: "og:description",
        content:
          "تتبع الحفظ، جدولة الامتحانات، إصدار الشهادات ومتابعة تحليلات المدرسة.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BookOpen, title: "تتبع الحفظ", desc: "تابع تقدّم الأجزاء والأحزاب والسور مع مستويات المراجعة والدرجات." },
  { icon: GraduationCap, title: "الامتحانات", desc: "احجز وأدر امتحانات 15 و30 و45 و60 حزباً مع اللجان والنتائج." },
  { icon: Award, title: "الشهادات", desc: "إنشاء شهادات PDF جميلة تلقائياً مع التحقق عبر QR." },
  { icon: CalendarCheck, title: "الحضور", desc: "سجل الحضور والغياب والأعذار مع تحليلات غنية." },
  { icon: Video, title: "الاجتماعات عبر الإنترنت", desc: "جدولة وإطلاق اجتماعات مع الطلاب وأولياء الأمور." },
  { icon: BarChart3, title: "تحليلات المدرسة", desc: "رسوم بيانية خطية وشريطية ودائرية للطلاب والفصول والمعلمين." },
  { icon: Bell, title: "الإعلانات", desc: "إعلانات عامة، امتحانات، فعاليات، اجتماعات وإشعارات عاجلة." },
  { icon: ShieldCheck, title: "الوصول حسب الأدوار", desc: "مدير، منظم، معلم، طالب وولي أمر — كلٌ بحسب صلاحياته." },
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
            <span className="font-display text-xl font-bold text-primary">نور القرآن</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" search={{ mode: "login" }}>
              <Button variant="ghost">تسجيل الدخول</Button>
            </Link>
            <Link to="/auth" search={{ mode: "register" }}>
              <Button>ابدأ الآن</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="pattern-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="font-display text-2xl text-secondary">بسم الله الرحمن الرحيم</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-5xl">
            منصة متكاملة لإدارة مدرستك القرآنية
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            تتبع الحفظ، إجراء الامتحانات، إصدار الشهادات، متابعة الحضور واستضافة الاجتماعات — كل ذلك في مكان واحد آمن وجميل.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "register" }}>
              <Button size="lg">إنشاء حسابك</Button>
            </Link>
            <Link to="/auth" search={{ mode: "login" }}>
              <Button size="lg" variant="outline">لدي حساب بالفعل</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-foreground">كل شيء في مكان واحد</h2>
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
          © {new Date().getFullYear()} مدرسة نور القرآن. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
}
