"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, UserPlus } from "lucide-react";
import Link from "next/link";
import InputField from "@/app/components/InputField";
import TerminalButton from "@/app/components/TerminalButton";
import styles from "./styles.module.css";

interface FormState {
  nome: string;
  email: string;
  senha: string;
}

interface FormErrors {
  nome?: string;
  email?: string;
  senha?: string;
}

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!values.nome.trim()) {
    errors.nome = "campo obrigatório";
  } else if (values.nome.trim().length < 3) {
    errors.nome = "mínimo 3 caracteres";
  }

  if (!values.email) {
    errors.email = "campo obrigatório";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "e-mail inválido";
  }

  if (!values.senha) {
    errors.senha = "campo obrigatório";
  } else if (values.senha.length < 6) {
    errors.senha = "mínimo 6 caracteres";
  }

  return errors;
}

export default function CadastroForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({ nome: "", email: "", senha: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const erros = validate(form);
      if (Object.keys(erros).length > 0) {
        setErrors(erros);
        return;
      }

      setLoading(true);
      await new Promise((r) => setTimeout(r, 1200));
      setLoading(false);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    },
    [form, router]
  );

  if (success) {
    return (
      <div className={styles.successState}>
        <span className={styles.successIcon}>✓</span>
        <p>Credenciais registradas.</p>
        <p className={styles.successSub}>Redirecionando para o login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <InputField
        label="Nome do Operador"
        icon={User}
        type="text"
        name="nome"
        autoComplete="name"
        placeholder="Seu nome completo"
        value={form.nome}
        onChange={handleChange}
        error={errors.nome}
      />

      <InputField
        label="Endereço de E-mail"
        icon={Mail}
        type="email"
        name="email"
        autoComplete="email"
        placeholder="operador@cloud.io"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
      />

      <InputField
        label="Senha"
        icon={Lock}
        type="password"
        name="senha"
        autoComplete="new-password"
        placeholder="••••••••"
        value={form.senha}
        onChange={handleChange}
        error={errors.senha}
      />

      <TerminalButton type="submit" loading={loading}>
        <UserPlus size={13} style={{ display: "inline", marginRight: 8 }} />
        Registrar Acesso
      </TerminalButton>

      <p className={styles.switchLink}>
        Já tem acesso?{" "}
        <Link href="/login" className={styles.link}>
          Fazer login →
        </Link>
      </p>
    </form>
  );
}
