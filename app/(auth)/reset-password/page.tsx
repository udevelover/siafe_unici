"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processRecovery() {
      const hash = window.location.hash;

      console.log("HASH:", hash);

      if (!hash.includes("access_token")) {
        setError("Token inválido o ausente.");
        return;
      }

    const params = new URLSearchParams(hash.replace("#", ""));

    const access_token = params.get("access_token") ?? "";
    const refresh_token = params.get("refresh_token") ?? access_token;
    const type = params.get("type") ?? "";

    console.log("ACCESS TOKEN:", access_token);
    console.log("TYPE:", type);

    // Validación explícita para evitar null
    if (!access_token || type !== "recovery") {
      setError("Token inválido o expirado.");
      return;
    }

      // 👉 Aquí se crea la sesión temporal (IMPORTANTE)
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        console.error(error);
        setError("Error al validar token.");
        return;
      }

      if (!data?.session) {
        setError("No se pudo iniciar sesión temporal.");
        return;
      }

      setTokenValidated(true);
    }

    processRecovery();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tokenValidated) {
      setError("No se puede actualizar porque el token no es válido.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setLoading(false);
        setError("Error al actualizar contraseña: " + error.message);
        return;
      }

      setLoading(false);

      alert("Contraseña actualizada con éxito.");
      router.push("/login");
    } catch (err: any) {
      setLoading(false);
      setError("Error inesperado: " + (err.message ?? err));
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-6 border rounded shadow"
      >
        <h2 className="text-xl font-semibold mb-4">Restablecer contraseña</h2>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {!tokenValidated ? (
          <p className="text-gray-700">Validando token...</p>
        ) : (
          <>
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
          </>
        )}
      </form>
    </div>
  );
}
