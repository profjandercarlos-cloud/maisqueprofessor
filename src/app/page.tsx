import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { DIAGNOSTIC_STEPS, getResumeSlug } from "@/lib/diagnostico/steps";
import { LogoutButton } from "./logout-button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const diagnostic = user
    ? await db.diagnostic.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const activePlan = user
    ? await db.plan.findFirst({
        where: { userId: user.id, status: "ATIVO" },
        include: { possibility: true },
      })
    : null;

  const diagnosticCta = !diagnostic
    ? { label: "Começar diagnóstico", href: `/diagnostico/${DIAGNOSTIC_STEPS[0].slug}` }
    : diagnostic.status === "EM_ANDAMENTO"
      ? {
          label: "Continuar diagnóstico",
          href: `/diagnostico/${getResumeSlug(diagnostic.intention, diagnostic.answers as Record<string, unknown>)}`,
        }
      : { label: "Ver diagnóstico concluído", href: "/diagnostico/concluido" };

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="INÍCIO" />

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
            Autenticação confirmada
          </span>
          <h1 className="mb-3.5 font-serif text-[clamp(28px,5vw,38px)] leading-[1.15] font-medium tracking-tight text-petrol">
            Olá, <em className="font-medium text-gold not-italic italic">{user?.email}</em>.
          </h1>
        </div>
        <LogoutButton />
      </div>

      {activePlan ? (
        <a
          href={`/planos/${activePlan.id}`}
          className="mb-4 block rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)] hover:border-petrol"
        >
          <span className="mb-1 block font-mono text-[10px] tracking-wide text-gold uppercase">
            Plano ativo
          </span>
          <span className="block font-serif text-lg font-medium text-ink">
            {activePlan.possibility.titulo}
          </span>
        </a>
      ) : (
        <a
          href={diagnosticCta.href}
          className="mb-4 inline-block rounded-lg bg-petrol px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft"
        >
          {diagnosticCta.label} →
        </a>
      )}

      <div className="flex gap-5 text-[13.5px] font-semibold text-petrol">
        <a href="/planos" className="hover:underline">
          Meus planos →
        </a>
        <a href="/configuracoes" className="hover:underline">
          Configurações →
        </a>
      </div>
    </div>
  );
}
