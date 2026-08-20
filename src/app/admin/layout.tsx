import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { requireAdmin } from "@/lib/auth/require-active-access";

const NAV_ITEMS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/hotmart", label: "Transações Hotmart" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-[1100px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="ADMINISTRAÇÃO" />

      <nav className="mb-8 flex flex-wrap items-center gap-2">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-petrol hover:text-petrol"
          >
            {item.label}
          </a>
        ))}
        <a
          href="/"
          className="ml-auto text-[13px] font-semibold text-petrol hover:underline"
        >
          ← Voltar ao app
        </a>
      </nav>

      {children}
    </div>
  );
}
