
import AuthCard from "@/app/components/AuthCard";
import CadastroForm from "./CadastroForm";

export default function CadastroPage() {
  return (
    <AuthCard
      title="Registrar Operador"
      subtitle="Crie suas credenciais de acesso ao painel de monitoramento."
      prompt="root@cloudterm:~/register$"
    >
      <CadastroForm />
    </AuthCard>
  );
}
