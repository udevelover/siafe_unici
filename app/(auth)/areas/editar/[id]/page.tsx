"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ThreeDot } from "react-loading-indicators";

const EditarDepartamento: React.FC = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();

  const departamentoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [nombreDepartamento, setNombreDepartamento] = useState("");
  const [plantelId, setPlantelId] = useState("");
  const [planteles, setPlanteles] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: departamento, error: departamentoError } = await supabase
        .from("departamentos")
        .select("nombre_departamento, plantel_id")
        .eq("id", departamentoId)
        .single();

      if (departamentoError) {
        console.error("Error al cargar el departamento:", departamentoError.message);
        alert("Error al cargar los datos del departamento.");
        router.push("/areas");
        return;
      }

      setNombreDepartamento(departamento.nombre_departamento);
      setPlantelId(departamento.plantel_id);

      const { data: plantelesData, error: plantelesError } = await supabase
        .from("plantel")
        .select("id, nombre_plantel")
        .order("nombre_plantel", { ascending: true });

      if (plantelesError) {
        console.error("Error al cargar planteles:", plantelesError.message);
        return;
      }

      const mapeados = plantelesData.map((p: any) => ({
        id: p.id,
        nombre: p.nombre_plantel,
      }));

      setPlanteles(mapeados);
      setLoading(false);
    };

    if (departamentoId) fetchData();
  }, [departamentoId, supabase, router]);

  const handleGuardar = async () => {
    if (!nombreDepartamento.trim() || !plantelId) {
      alert("Debe ingresar el nombre del departamento y seleccionar un plantel.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("departamentos")
      .update({
        nombre_departamento: nombreDepartamento.trim(),
        plantel_id: plantelId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", departamentoId);

    setLoading(false);

    if (error) {
      console.error("Error actualizando el departamento:", error);
      alert("Error al actualizar el departamento: " + JSON.stringify(error));
      return;
    }

    setSuccessMessage("¡Departamento actualizado con éxito!");
    setTimeout(() => {
      router.push("/areas");
    }, 2000);
  };

  const handleCancelar = () => {
    router.push("/areas");
  };

  return (
    <div className="relative p-8 bg-white max-h-screen">
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
        <span className="font-bold text-black">Departamentos</span> | Editar departamento
      </h2>

      <div className="border rounded shadow bg-white">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t">
          Datos del departamento a editar
        </div>

        <div className="p-4">
          <label className="block mb-2 font-medium">Plantel asociado:</label>
          <select
            value={plantelId}
            onChange={(e) => setPlantelId(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          >
            <option value="">Seleccione un plantel</option>
            {planteles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <label className="block mb-2 font-medium">Nombre del departamento:</label>
          <input
            type="text"
            value={nombreDepartamento}
            onChange={(e) => setNombreDepartamento(e.target.value)}
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

export default EditarDepartamento;
