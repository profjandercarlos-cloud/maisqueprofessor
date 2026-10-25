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
        <img src="${APP_URL}/icon" width="40" height="40" alt="Renda Além da Sala" style="display:block;margin:0 auto 8px;" />
        <div style="font-size:15px;font-weight:700;color:#081828;">Renda Além da Sala</div>
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

// E-mail do cadastro gratuito. Não usa o convite do Supabase de propósito: o
// template dele é o da compra ("Sua compra foi confirmada") e o link passa pelo
// verificador do Supabase, que gasta o token no primeiro acesso — um antivírus
// de e-mail que "abra" o link antes da pessoa já o deixava expirado. Aqui o link
// cai numa tela com botão (/auth/continuar): só o clique de uma pessoa confirma.
export async function sendBoasVindasGratuita(params: { to: string; name: string; link: string }) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Confirme seu e-mail para entrar na Renda Além da Sala",
    html: wrapEmailHtml(`<p>Olá, ${params.name}.</p>
<p>Sua conta gratuita está quase pronta. Confirme seu e-mail e escolha uma senha para explorar as ideias de negócios para professores:</p>
<p style="text-align:center;margin:28px 0;"><a href="${params.link}" style="background:#00838f;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:8px;display:inline-block;">Confirmar e definir minha senha</a></p>
<p style="color:#666666;font-size:13px;">Se você não pediu esta conta, pode ignorar este e-mail.</p>`),
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
<p>Seu Plano Prof+ da Renda Além da Sala expira em ${params.daysRemaining} dias. Renove sua compra para não perder o acesso ao seu plano.</p>`),
  });
}
