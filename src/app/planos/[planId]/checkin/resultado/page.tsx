import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export default async function CheckinResultadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { planId } = await params;
  const query = await searchParams;
  const weekNumber = Number(query.week);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.userId !== user.id) notFound();

  const week = await db.planWeek.findFirst({
    where: { planId, weekNumber },
    include: { checkin: { include: { guidance: true } } },
  });
  if (!week?.checkin?.guidance) notFound();

  return (
    <div className="mx-auto w-full max-w-[600px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="CHECK-IN CONFIRMADO" />

      <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Semana {week.weekNumber} registrada
      </span>
      <h1 className="mb-6 font-serif text-2xl font-medium tracking-tight text-petrol">
        Check-in confirmado.
      </h1>

      <div className="mb-8 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
        <p className="text-[15px] leading-[1.6] text-ink">{week.checkin.guidance.personalizedText}</p>
      </div>

      <a href={`/planos/${planId}`} className="text-[14px] font-semibold text-petrol hover:underline">
        ← Voltar para o plano
      </a>
    </div>
  );
}
