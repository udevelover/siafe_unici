"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ThreeDot } from "react-loading-indicators";

const EditarConceptoPago: React.FC = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();

  const conceptoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [descripcion, setDescripcion] = useState("");
  const [status, setStatus] = useState("Activo");
  const [plantelId, setPlantelId] = useState("");
  const [planteles, setPlanteles] = useState<{ id: string; nombre_plantel: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchPlanteles = async () => {
      const { data, error } = await supabase.from("plantel").select("id, nombre_plantel");
      if (error) console.error("Error cargando planteles:", error);
      else setPlanteles(data);
    };

    fetchPlanteles();
  }, [supabase]);

  useEffect(() => {
    if (!conceptoId) return;

    const fetchConcepto = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("concepto_pago")
        .select("descripcion, status, plantel_id")
        .eq("id", conceptoId)
        .single();

      setLoading(false);

      if (error) {
        console.error("Error al cargar el concepto:", error.message);
        alert("Error al cargar los datos del concepto.");
        router.push("/conceptos");
        return;
      }

      setDescripcion(data.descripcion);
      setStatus(data.status);
      setPlantelId(data.plantel_id || "");
    };

    fetchConcepto();
  }, [conceptoId, supabase, router]);

  const handleGuardar = async () => {
    if (!descripcion.trim() || !plantelId) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("concepto_pago")
      .update({
        descripcion,
        status,
        plantel_id: plantelId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conceptoId);

    setLoading(false);

    if (error) {
      console.error("Error actualizando el concepto:", error);
      alert("Error al actualizar el concepto: " + JSON.stringify(error));
      return;
    }

    setSuccessMessage("¡Concepto actualizado con éxito!");
    setTimeout(() => {
      router.push("/conceptos");
    }, 2000);
  };

  const handleCancelar = () => {
    router.push("/conceptos");
  };

  return (
    <div className="relative p-8 max-h-screen">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-40">
          <ThreeDot color="#2464ec" size="large" />
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded shadow">
          {successMessage}
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-6">
        <span className="font-bold text-black">Conceptos de Pago</span> | Editar concepto
      </h2>

      <div className="border rounded shadow bg-white">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t">
          Datos del concepto a editar
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
            {planteles.map((plantel: any) => (
              <option key={plantel.id} value={plantel.id}>
                {plantel.nombre_plantel}
              </option>
            ))}
          </select>

          <label className="block mb-2 font-medium">Descripción:</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          />

          <label className="block mb-2 font-medium">Estatus:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

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

export default EditarConceptoPago;
