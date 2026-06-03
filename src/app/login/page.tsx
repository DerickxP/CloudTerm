import AuthCard from "@/app/components/AuthCard";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthCard
      title="Acesso ao Terminal"
      subtitle="Autentique-se para acessar o painel de monitoramento cloud."
      prompt="root@cloudterm:~/auth$"
    >
      <LoginForm />
    </AuthCard>
  );
}
