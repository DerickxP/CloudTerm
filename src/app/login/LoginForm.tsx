"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Terminal } from "lucide-react";
import Link from "next/link";
import InputField from "@/app/components/InputField";
import TerminalButton from "@/app/components/TerminalButton";
import styles from "./styles.module.css";

interface FormState {
  email: string;
  senha: string;
}

interface FormErrors {
  email?: string;
  senha?: string;
}

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};

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

export default function LoginForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({ email: "", senha: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

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
      router.push("/splash");
    },
    [form, router]
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
        autoComplete="current-password"
        placeholder="••••••••"
        value={form.senha}
        onChange={handleChange}
        error={errors.senha}
      />

      <TerminalButton type="submit" loading={loading}>
        <Terminal size={13} style={{ display: "inline", marginRight: 8 }} />
        Iniciar Sessão
      </TerminalButton>

      <p className={styles.switchLink}>
        Sem acesso?{" "}
        <Link href="/cadastro" className={styles.link}>
          Solicitar credenciais →
        </Link>
      </p>
    </form>
  );
}
