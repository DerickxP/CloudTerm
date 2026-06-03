import { redirect } from "next/navigation";

// PERFORMANCE: redirect no servidor — zero JS no cliente para essa rota
export default function Home() {
  redirect("/login");
}
