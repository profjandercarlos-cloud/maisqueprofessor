import { redirect } from "next/navigation";

// Endereço antigo ("Minha lista"). Quem tiver salvo o link cai nos favoritos.
export default function ListaAntiga() {
  redirect("/negocios/favoritos");
}
