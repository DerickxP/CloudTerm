// PERFORMANCE: A splash page usa "use client" apenas no componente de dashboard
// O Server Component wraps o Client Component, mantendo o shell estático no servidor
import DashboardClient from "./DashboardClient";

export default function SplashPage() {
  return <DashboardClient />;
}
