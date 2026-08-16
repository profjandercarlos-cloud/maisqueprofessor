import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// ATENÇÃO: o domínio em EMAIL_FROM precisa estar verificado no painel da
// Resend antes de enviar em produção — sem isso, o envio falha. Até lá, dá
// pra usar o remetente de testes da própria Resend (onboarding@resend.dev).
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Mais Que Professor <onboarding@resend.dev>";
