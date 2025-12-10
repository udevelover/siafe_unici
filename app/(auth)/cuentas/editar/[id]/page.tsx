"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ThreeDot } from "react-loading-indicators";

const EditarCuenta: React.FC = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();

  const cuentaId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [banco, setBanco] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [plantelId, setPlantelId] = useState("");
  const [planteles, setPlanteles] = useState<{ id: string; nombre_plantel: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchPlanteles = async () => {
      const { data, error } = await supabase
        .from("plantel")
        .select("id, nombre_plantel")
        .order("nombre_plantel", { ascending: true });

      if (!error && data) {
        setPlanteles(data);
      }
    };

    fetchPlanteles();
  }, [supabase]);

  useEffect(() => {
    if (!cuentaId) return;

    const fetchCuenta = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("cuenta_banco")
        .select("banco, numero_cuenta, razon_social, plantel_id")
        .eq("id", cuentaId)
        .single();

      setLoading(false);

      if (error) {
        console.error("Error al cargar cuenta:", error.message);
        alert("Error al cargar los datos de la cuenta.");
        router.push("/cuentas");
        return;
      }

      if (data) {
        setBanco(data.banco);
        setNumeroCuenta(data.numero_cuenta);
        setRazonSocial(data.razon_social);
        setPlantelId(data.plantel_id ?? "");
      }
    };

    fetchCuenta();
  }, [cuentaId, supabase, router]);

  const handleGuardar = async () => {
    if (!banco.trim() || !numeroCuenta.trim() || !razonSocial.trim() || !plantelId) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("cuenta_banco")
      .update({
        banco,
        numero_cuenta: numeroCuenta,
        razon_social: razonSocial,
        plantel_id: plantelId,
        updated_at: new Date(),
      })
      .eq("id", cuentaId);

    setLoading(false);

    if (error) {
      console.error("Error actualizando cuenta:", error);
      alert("Error actualizando cuenta: " + JSON.stringify(error));
      return;
    }

    setSuccessMessage("¡Cuenta bancaria actualizada con éxito!");
    setTimeout(() => {
      router.push("/cuentas");
    }, 2000);
  };

  const handleCancelar = () => {
    router.push("/cuentas");
  };

  return (
    <div className="relative p-8 max-h-screen">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-40">
          <ThreeDot color="#2464ec" size="large" text="" textColor="" />
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded shadow">
          {successMessage}
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-6">
        <span className="font-bold text-black">Cuentas Bancarias</span> | Editar cuenta
      </h2>

      <div className="border rounded shadow bg-white">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t">
          Datos de la cuenta bancaria
        </div>

        <div className="p-4">
          <label className="block mb-2 font-medium">Plantel:</label>
          <select
            value={plantelId}
            onChange={(e) => setPlantelId(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          >
            <option value="">Seleccione un plantel</option>
            {planteles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre_plantel}
              </option>
            ))}
          </select>

          <label className="block mb-2 font-medium">Banco:</label>
          <input
            type="text"
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          />

          <label className="block mb-2 font-medium">Número de cuenta:</label>
          <input
            type="text"
            value={numeroCuenta}
            onChange={(e) => setNumeroCuenta(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          />

          <label className="block mb-2 font-medium">Razón social:</label>
          <input
            type="text"
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          />

          <div className="flex justify-end items-center gap-2">
            <button
              onClick={handleCancelar}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              onClick={handleGuardar}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              disabled={loading}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarCuenta;
