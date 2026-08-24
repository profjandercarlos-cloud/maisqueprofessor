import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format-date";
import { formatDiagnosticInput } from "@/lib/ai-engine/format-diagnostic-input";
import { OBSTACLE_LABELS } from "@/lib/orientacao/biblioteca";
import { REPORT_SECTIONS, type Relatorio } from "@/lib/plano/relatorio";

const PETROL = "#1b3a3a";
const INK = "#24302e";
const INK_MUTED = "#6b6b63";

const TASK_STATUS_LABEL: Record<string, string> = {
  PENDENTE: "não iniciada",
  COMPLETO: "completa",
  PARCIAL: "parcial",
};

const PLAN_STATUS_LABEL: Record<string, string> = {
  ATIVO: "ativo",
  PAUSADO: "pausado",
  CONGELADO: "congelado",
};

// Exportação de dados (LGPD, direito de portabilidade) — em PDF pra ser
// legível de fato, não um JSON cru. Traz o diagnóstico, os planos gerados
// e o progresso semana a semana registrado em cada um.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: {
      diagnostics: {
        orderBy: { createdAt: "asc" },
        include: { rounds: { orderBy: { roundNumber: "asc" }, include: { possibilities: true } } },
      },
      plans: {
        orderBy: { createdAt: "asc" },
        include: {
          possibility: true,
          weeks: {
            orderBy: { weekNumber: "asc" },
            include: {
              tasks: { orderBy: { sequencia: "asc" } },
              checkin: { include: { guidance: true } },
              journalEntry: true,
            },
          },
        },
      },
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "usuário não encontrado" }, { status: 404 });
  }

  const doc = new PDFDocument({ size: "A4", margins: { top: 60, bottom: 60, left: 60, right: 60 } });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const h1 = (text: string) => {
    doc.moveDown(0.6).fontSize(19).font("Helvetica-Bold").fillColor(PETROL).text(text);
  };
  const h2 = (text: string) => {
    doc.moveDown(1).fontSize(13.5).font("Helvetica-Bold").fillColor(PETROL).text(text);
  };
  const h3 = (text: string) => {
    doc.moveDown(0.5).fontSize(11).font("Helvetica-Bold").fillColor(INK).text(text);
  };
  const body = (text: string) => {
    doc.moveDown(0.15).fontSize(10).font("Helvetica").fillColor(INK).text(text, { lineGap: 2.5 });
  };
  const meta = (text: string) => {
    doc.moveDown(0.15).fontSize(9).font("Helvetica-Oblique").fillColor(INK_MUTED).text(text);
  };
  const rule = () => {
    doc.moveDown(0.8);
    const y = doc.y;
    doc
      .strokeColor("#d8d4c8")
      .lineWidth(0.5)
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .stroke();
    doc.moveDown(0.8);
  };

  // Capa
  doc.fontSize(22).font("Helvetica-Bold").fillColor(PETROL).text("Mais Que Professor");
  doc.fontSize(13).font("Helvetica").fillColor(INK_MUTED).text("Seus dados");
  doc.moveDown(1.2);
  doc.fontSize(11).font("Helvetica").fillColor(INK).text(`Nome: ${dbUser.name}`);
  doc.text(`E-mail: ${dbUser.email}`);
  doc.text(`Exportado em: ${formatDate(new Date(), { day: "2-digit", month: "long", year: "numeric" })}`);
  rule();

  // Diagnóstico
  h1("Diagnóstico");
  if (dbUser.diagnostics.length === 0) {
    body("Nenhum diagnóstico respondido ainda.");
  }
  for (const diagnostic of dbUser.diagnostics) {
    h2(`Respondido em ${formatDate(diagnostic.createdAt, { day: "2-digit", month: "long", year: "numeric" })}`);
    if (diagnostic.status !== "CONCLUIDO") meta("Diagnóstico incompleto (em andamento).");
    body(formatDiagnosticInput(diagnostic));

    for (const round of diagnostic.rounds) {
      h3(
        round.roundNumber === 1
          ? "Possibilidades geradas"
          : `Possibilidades geradas — rodada de ajuste ${round.roundNumber - 1}`,
      );
      if (round.feedbackText) meta(`Seu feedback pro conjunto anterior: "${round.feedbackText}"`);
      for (const p of round.possibilities) {
        const statusLabel =
          p.status === "APROVADA" ? " (escolhida — virou plano)" : p.status === "REJEITADA" ? " (não escolhida)" : "";
        body(`• ${p.titulo}${statusLabel}`);
      }
    }
  }

  // Planos
  for (const plan of dbUser.plans) {
    doc.addPage();
    h1(plan.possibility.titulo);
    meta(
      `Status: ${PLAN_STATUS_LABEL[plan.status] ?? plan.status} · Iniciado em ${formatDate(plan.activatedAt, { day: "2-digit", month: "long", year: "numeric" })} · ${plan.tempoDisponivelHoras}h/semana declaradas`,
    );
    rule();

    h2("Relatório");
    const relatorio = plan.relatorio as unknown as Relatorio;
    for (const section of REPORT_SECTIONS) {
      h3(section.label);
      body(relatorio[section.key]);
    }

    h2(`Execução — ${plan.duracaoSemanas} semanas`);
    for (const week of plan.weeks) {
      h3(`Semana ${week.weekNumber} — ${week.meta}`);
      meta(
        `Data prevista: ${formatDate(week.scheduledDate, { day: "2-digit", month: "short", year: "numeric" })} · ${week.status === "CONCLUIDA" ? "concluída" : "pendente"}`,
      );
      for (const task of week.tasks) {
        body(`• ${task.texto} (${task.horasEstimadas}h — ${TASK_STATUS_LABEL[task.status] ?? task.status})`);
        if (task.status === "PARCIAL" && task.notaParcial) meta(`  O que faltou: ${task.notaParcial}`);
      }
      if (week.dificuldadesAntecipadas) meta(`Costuma travar em: ${week.dificuldadesAntecipadas}`);

      if (week.checkin) {
        body(`Check-in — obstáculo relatado: ${OBSTACLE_LABELS[week.checkin.obstacleCategory]}`);
        if (week.checkin.freeText) body(`Contexto registrado: ${week.checkin.freeText}`);
        if (week.checkin.guidance) meta(`Orientação recebida: ${week.checkin.guidance.personalizedText}`);
      }
      if (week.journalEntry) body(`Diário desta semana: ${week.journalEntry.text}`);
    }
  }

  doc.end();
  const buffer = await finished;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mais-que-professor-meus-dados.pdf"`,
    },
  });
}
