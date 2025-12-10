"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ThreeDot } from "react-loading-indicators";

type Plantel = { id: string; nombre_plantel: string };

const RegistroSucursal: React.FC = () => {
  const [supabase] = useState(() => createClientComponentClient());

  const router = useRouter();

  const [planteles, setPlanteles] = useState<Plantel[]>([]);
  const [plantelId, setPlantelId] = useState("");
  const [nombreSucursal, setNombreSucursal] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const cargarPlanteles = async () => {
      const { data, error } = await supabase
        .from("plantel")
        .select("id, nombre_plantel")
        .order("nombre_plantel", { ascending: true });

      if (error) {
        console.error("Error cargando planteles:", error);
        alert("Error cargando planteles: " + JSON.stringify(error));
        return;
      }
      setPlanteles(data || []);
    };

    cargarPlanteles();
  }, [supabase]);

  const handleGuardar = async () => {
    if (!plantelId) return alert("Debe seleccionar un plantel.");
    if (!nombreSucursal.trim()) return alert("Debe ingresar el nombre de la sucursal.");

    setLoading(true);

    const { error } = await supabase.from("sucursales").insert([
      {
        plantel_id: plantelId,
        nombre: nombreSucursal.trim(),
      },
    ]);

    setTimeout(() => setLoading(false), 800);

    if (error) {
      console.error("Error guardando la sucursal:", error);
      alert("Error guardando la sucursal: " + JSON.stringify(error));
      return;
    }

    setSuccessMessage("¡Sucursal guardada con éxito!");
    setTimeout(() => {
      router.push("/sucursales");
    }, 1500);
  };

  const handleCancelar = () => router.push("/sucursales");

  return (
    <div className="relative p-8 bg-white-100 max-h-screen">
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
        <span className="font-bold text-black">Sucursales</span> | Registro de sucursales
      </h2>

      <div className="border rounded shadow bg-white">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t">
          Datos de la sucursal a registrar
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block mb-2 font-medium">Seleccione un plantel</label>
            <select
              value={plantelId}
              onChange={(e) => setPlantelId(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            >
              <option value="">Seleccione un plantel</option>
              {planteles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_plantel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Nombre de la sucursal</label>
            <input
              type="text"
              value={nombreSucursal}
              onChange={(e) => setNombreSucursal(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Ej. Sucursal Centro"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end items-center gap-2 pt-2">
            <button
              onClick={handleCancelar}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-60"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
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

export default RegistroSucursal;
