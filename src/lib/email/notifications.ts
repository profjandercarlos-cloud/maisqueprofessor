import { getResend, EMAIL_FROM } from "./client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendCheckinReminder(params: {
  to: string;
  name: string;
  planId: string;
  weekNumber: string | number;
}) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Seu check-in semanal está esperando",
    html: `<p>Olá, ${params.name}.</p>
<p>A semana ${params.weekNumber} do seu plano ainda não teve check-in. Leva 2 minutos.</p>
<p><a href="${APP_URL}/planos/${params.planId}/checkin">Fazer check-in agora</a></p>`,
  });
}

export async function sendEscalationMessage(params: {
  to: string;
  name: string;
  planId: string;
  weeksWithoutCheckin: number;
}) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Faz tempo que você não faz check-in — o que você quer fazer?",
    html: `<p>Olá, ${params.name}.</p>
<p>Já são ${params.weeksWithoutCheckin} semanas sem check-in no seu plano. Sem julgamento — a vida acontece.
Mas pra não deixar o plano parado sem rumo, escolha um caminho:</p>
<ul>
  <li><a href="${APP_URL}/planos/${params.planId}/checkin">Fazer o check-in agora</a></li>
  <li><a href="${APP_URL}/planos">Trocar para outro plano ativo</a></li>
  <li><a href="${APP_URL}/planos">Pausar este plano por enquanto</a></li>
</ul>`,
  });
}

export async function sendAccessExpiringReminder(params: {
  to: string;
  name: string;
  daysRemaining: number;
}) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Seu acesso expira em ${params.daysRemaining} dias`,
    html: `<p>Olá, ${params.name}.</p>
<p>Seu acesso ao Mais Que Professor expira em ${params.daysRemaining} dias. Renove sua compra para não perder o acesso ao seu plano.</p>`,
  });
}
