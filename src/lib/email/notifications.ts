import { getResend, EMAIL_FROM } from "./client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Cabeçalho com a marca em todo e-mail transacional — mesmo layout usado no
// template de convite colado no painel do Supabase (fora do código, por isso
// não dá pra compartilhar a função). ${APP_URL}/icon é a mesma rota gerada
// por src/app/icon.tsx, liberada no proxy pra ficar acessível sem login.
function wrapEmailHtml(bodyHtml: string): string {
  return `<div style="background-color:#f5f3ee;padding:32px 16px;font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:32px 32px 20px;text-align:center;">
        <img src="${APP_URL}/icon" width="40" height="40" alt="Mais Que Professor" style="display:block;margin:0 auto 8px;" />
        <div style="font-size:15px;font-weight:700;color:#0b1420;">Mais Que Professor</div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px;color:#333333;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </td>
    </tr>
  </table>
</div>`;
}

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
    html: wrapEmailHtml(`<p>Olá, ${params.name}.</p>
<p>A semana ${params.weekNumber} do seu plano ainda não teve check-in. Leva 2 minutos.</p>
<p><a href="${APP_URL}/planos/${params.planId}/checkin">Fazer check-in agora</a></p>`),
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
    html: wrapEmailHtml(`<p>Olá, ${params.name}.</p>
<p>Já são ${params.weeksWithoutCheckin} semanas sem check-in no seu plano. Sem julgamento — a vida acontece.
Mas pra não deixar o plano parado sem rumo, escolha um caminho:</p>
<ul>
  <li><a href="${APP_URL}/planos/${params.planId}/checkin">Fazer o check-in agora</a></li>
  <li><a href="${APP_URL}/planos">Trocar para outro plano ativo</a></li>
  <li><a href="${APP_URL}/planos">Pausar este plano por enquanto</a></li>
</ul>`),
  });
}

export async function sendUntouchedWeekReminder(params: {
  to: string;
  name: string;
  planId: string;
  weekNumber: string | number;
}) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Faltam 3 dias pro seu check-in — quer adiantar alguma coisa?",
    html: wrapEmailHtml(`<p>Olá, ${params.name}.</p>
<p>Faltam 3 dias pro check-in da semana ${params.weekNumber} do seu plano, e nenhuma tarefa foi marcada ainda. Não precisa ser tudo de uma vez — uma versão pequena de uma tarefa já ajuda a manter o ritmo.</p>
<p><a href="${APP_URL}/">Ver minhas tarefas da semana</a></p>`),
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
    html: wrapEmailHtml(`<p>Olá, ${params.name}.</p>
<p>Seu acesso ao Mais Que Professor expira em ${params.daysRemaining} dias. Renove sua compra para não perder o acesso ao seu plano.</p>`),
  });
}
