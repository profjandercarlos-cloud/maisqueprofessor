import { Resend } from "resend";

// Instanciado sob demanda (não no carregamento do módulo) — o construtor da
// Resend valida a chave imediatamente e lança erro se ela não existir, o que
// quebrava o build do Next.js ao coletar dados de rotas que só importam isto
// sem nunca chegar a enviar e-mail (ex.: o endpoint do cron).
let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

// ATENÇÃO: o domínio em EMAIL_FROM precisa estar verificado no painel da
// Resend antes de enviar em produção — sem isso, o envio falha. Até lá, dá
// pra usar o remetente de testes da própria Resend (onboarding@resend.dev).
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Mais Que Professor <onboarding@resend.dev>";
