'use client';

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ThreeDot } from "react-loading-indicators";

const EditarOfertaEducativa: React.FC = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();

  const ofertaId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [nombreOferta, setNombreOferta] = useState("");
  const [plantelId, setPlantelId] = useState("");
  const [planteles, setPlanteles] = useState<{ id: string; nombre_plantel: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!ofertaId) return;

    const fetchOferta = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("oferta_educativa")
        .select("nombre_oferta, plantel_id")
        .eq("id", ofertaId)
        .single();

      if (error) {
        console.error("Error al cargar oferta:", error.message);
        alert("Error al cargar datos de la oferta educativa.");
        router.push("/ofertas");
        return;
      }

      setNombreOferta(data.nombre_oferta);
      setPlantelId(data.plantel_id);
      setLoading(false);
    };

    const fetchPlanteles = async () => {
      const { data, error } = await supabase
        .from("plantel")
        .select("id, nombre_plantel");

      if (!error && data) {
        setPlanteles(data);
      }
    };

    fetchOferta();
    fetchPlanteles();
  }, [ofertaId, supabase, router]);

  const handleGuardar = async () => {
    if (!nombreOferta.trim() || !plantelId) {
      alert("Debe completar todos los campos.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("oferta_educativa")
      .update({
        nombre_oferta: nombreOferta,
        plantel_id: plantelId,
      })
      .eq("id", ofertaId);

    setLoading(false);

    if (error) {
      console.error("Error actualizando la oferta:", error);
      alert("Error actualizando la oferta educativa.");
      return;
    }

    setSuccessMessage("¡Oferta educativa actualizada con éxito!");
    setTimeout(() => {
      router.push("/ofertas");
    }, 2000);
  };

  const handleCancelar = () => {
    router.push("/ofertas");
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
        <span className="font-bold text-black">Oferta Educativa</span> | Editar
      </h2>

      <div className="border rounded shadow bg-white">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t">
          Datos de la oferta a editar
        </div>

        <div className="p-4">
          <label className="block mb-2 font-medium">Plantel asociado:</label>
          <select
            value={plantelId}
            onChange={(e) => setPlantelId(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          >
            <option value="">Selecciona un plantel</option>
            {planteles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre_plantel}
              </option>
            ))}
          </select>

          <label className="block mb-2 font-medium">Nombre de la oferta educativa:</label>
          <input
            type="text"
            value={nombreOferta}
            onChange={(e) => setNombreOferta(e.target.value)}
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

export default EditarOfertaEducativa;
