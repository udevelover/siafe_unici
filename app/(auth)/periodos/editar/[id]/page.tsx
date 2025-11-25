"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ThreeDot } from "react-loading-indicators";

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const formatearConcatenado = (inicioISO: string, finISO: string) => {
  if (!inicioISO || !finISO) return "";

  const inicio = new Date(inicioISO);
  const fin = new Date(finISO);

  const mesInicio = meses[inicio.getMonth()];
  const mesFin = meses[fin.getMonth()];
  const añoInicio = inicio.getFullYear();
  const añoFin = fin.getFullYear();

  if (añoInicio === añoFin) {
    return `${mesInicio} - ${mesFin} ${añoInicio}`;
  } else {
    return `${mesInicio} ${añoInicio} - ${mesFin} ${añoFin}`;
  }
};

const calcularDiffMesesPreciso = (inicio: Date, fin: Date) => {
  let months = (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth());

  if (fin.getDate() < inicio.getDate()) {
    months -= 1;
  }

  return months;
};

const calcularTipoPeriodo = (inicioISO: string, finISO: string): string => {
  const inicio = new Date(inicioISO);
  const fin = new Date(finISO);

  const diffMeses = calcularDiffMesesPreciso(inicio, fin);

  switch (diffMeses) {
    case 1: return "Mensual";
    case 2: return "Bimestral";
    case 3: return "Trimestral";
    case 4: return "Cuatrimestral";
    case 6: return "Semestral";
    case 12: return "Anual";
    default: return `${diffMeses} meses`;
  }
};

const EditarPeriodoPago: React.FC = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();

  const periodoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [inicioPeriodo, setInicioPeriodo] = useState("");
  const [finPeriodo, setFinPeriodo] = useState("");
  const [tipoPeriodo, setTipoPeriodo] = useState("");
  const [concatenado, setConcatenado] = useState("");
  const [plantelId, setPlantelId] = useState("");
  const [planteles, setPlanteles] = useState<{ id: string; nombre_plantel: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchPlanteles = async () => {
      const { data, error } = await supabase.from("plantel").select("id, nombre_plantel");
      if (!error && data) setPlanteles(data);
    };
    fetchPlanteles();
  }, [supabase]);

  useEffect(() => {
    if (!periodoId) return;

    const fetchPeriodo = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("periodo_pago")
        .select("inicio_periodo, fin_periodo, plantel_id")
        .eq("id", periodoId)
        .single();

      setLoading(false);

      if (error) {
        console.error("Error al cargar el periodo:", error.message);
        alert("Error al cargar los datos del periodo.");
        router.push("/periodos");
        return;
      }

      setInicioPeriodo(data.inicio_periodo);
      setFinPeriodo(data.fin_periodo);
      setPlantelId(data.plantel_id || "");
    };

    fetchPeriodo();
  }, [periodoId, supabase, router]);

  useEffect(() => {
    if (inicioPeriodo && finPeriodo) {
      setConcatenado(formatearConcatenado(inicioPeriodo, finPeriodo));
      setTipoPeriodo(calcularTipoPeriodo(inicioPeriodo, finPeriodo));
    } else {
      setConcatenado("");
      setTipoPeriodo("");
    }
  }, [inicioPeriodo, finPeriodo]);

  const handleGuardar = async () => {
    if (!inicioPeriodo || !finPeriodo || !plantelId) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("periodo_pago")
      .update({
        inicio_periodo: inicioPeriodo,
        fin_periodo: finPeriodo,
        tipo_periodo: tipoPeriodo,
        concatenado,
        plantel_id: plantelId,
      })
      .eq("id", periodoId);

    setLoading(false);

    if (error) {
      console.error("Error actualizando el periodo:", error);
      alert("Error al actualizar el periodo: " + JSON.stringify(error));
      return;
    }

    setSuccessMessage("¡Periodo actualizado con éxito!");
    setTimeout(() => {
      router.push("/periodos");
    }, 2000);
  };

  const handleCancelar = () => {
    router.push("/periodos");
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
        <span className="font-bold text-black">Periodos de Pago</span> | Editar periodo
      </h2>

      <div className="border rounded shadow bg-white">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t">
          Datos del periodo a editar
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
            {planteles.map((plantel) => (
              <option key={plantel.id} value={plantel.id}>
                {plantel.nombre_plantel}
              </option>
            ))}
          </select>

          <label className="block mb-2 font-medium">Inicio del periodo:</label>
          <input
            type="date"
            value={inicioPeriodo}
            onChange={(e) => setInicioPeriodo(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          />

          <label className="block mb-2 font-medium">Fin del periodo:</label>
          <input
            type="date"
            value={finPeriodo}
            onChange={(e) => setFinPeriodo(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          />

          <label className="block mb-2 font-medium">Tipo de periodo (calculado):</label>
          <input
            type="text"
            value={tipoPeriodo}
            readOnly
            className="w-full p-2 border rounded mb-4 bg-gray-100 text-gray-600"
          />

          <label className="block mb-2 font-medium">Concatenado:</label>
          <input
            type="text"
            value={concatenado}
            readOnly
            className="w-full p-2 border rounded mb-4 bg-gray-100 text-gray-600"
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

export default EditarPeriodoPago;
