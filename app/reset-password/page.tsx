"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient();
  const params = useSearchParams();
  const router = useRouter();

  const accessToken = params?.get("access_token") ?? null;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setMessage("Token no encontrado. Revisa el link que te llegó por correo.");
    }
  }, [accessToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!accessToken) {
      setMessage("Token inválido o expirado.");
      return;
    }

    if (!password || password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      // Con createClientComponentClient en una página client, Supabase detecta el token en la URL
      const { error } = await supabase.auth.updateUser({
        password,
      });

      setLoading(false);

      if (error) {
        console.error("Error al actualizar contraseña:", error);
        setMessage("Error al actualizar contraseña: " + error.message);
        return;
      }

      setMessage("Contraseña actualizada con éxito. Redirigiendo al login...");
      // Redirige al login o donde quieras
      setTimeout(() => router.push("/login"), 1400);
    } catch (err: any) {
      setLoading(false);
      setMessage("Error inesperado: " + String(err.message ?? err));
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 border rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Restablecer contraseña</h2>

        {message && <div className="mb-3 text-sm text-red-600">{message}</div>}

        <label className="block mb-2">Nueva contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-3"
          disabled={loading}
        />

        <label className="block mb-2">Confirmar contraseña</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          disabled={loading}
        />

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar nueva contraseña"}
        </button>
      </form>
    </div>
  );
}
