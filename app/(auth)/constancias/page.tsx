"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { generateCartaPDF } from "./structure/generatePDF";

const CartaPDFViewer: React.FC = () => {
  const supabase = createClientComponentClient();
  const [docentes, setDocentes] = useState<any[]>([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<string>("");
  const [nombreDocente, setNombreDocente] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocentes = async () => {
      const { data } = await supabase
        .from("docente")
        .select("id, nombre_docente")
        .order("nombre_docente", { ascending: true });

      if (data) setDocentes(data);
    };
    fetchDocentes();
  }, [supabase]);

  const handleDocenteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docenteId = e.target.value;
    setDocenteSeleccionado(docenteId);

    const docente = docentes.find((d) => String(d.id) === docenteId);
    setNombreDocente(docente?.nombre_docente || "");

    setPdfUrl(null);
    setError(null);
  };

  const generarCarta = async () => {
    if (!docenteSeleccionado) return;

    setLoadingPDF(true);
    setError(null);
    setPdfUrl(null);

    try {
      const pdfBlob = await generateCartaPDF(
        docenteSeleccionado,
        nombreDocente,
        supabase
      );
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (err: any) {
      setError(err.message || "Error generando PDF");
    } finally {
      setLoadingPDF(false);
    }
  };

  return (
    <div className="w-full p-3 flex justify-center min-h-[85vh]">

      <div className="w-full h-full bg-white rounded-xl shadow-lg p-8">

        <div className="mb-6">
          <h1 className="text-center text-3xl font-bold text-gray-800">
            Constancia de Prestación de Servicios
          </h1>
          <p className="text-center text-gray-600">
            Selecciona un docente, genera la constancia y visualízala al instante.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[75vh]">

          <div className="lg:col-span-1 space-y-6">
            <div className="p-5 rounded-xl border bg-gray-50">

              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Seleccionar docente
              </label>

              <select
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-center"
                value={docenteSeleccionado}
                onChange={handleDocenteChange}
              >
                <option value="" className="text-center">-- Elegir docente --</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id} className="text-center">
                    {d.nombre_docente}
                  </option>
                ))}
              </select>

              <button
                onClick={generarCarta}
                disabled={!docenteSeleccionado || loadingPDF}
                className={`mt-4 w-full py-2 text-white font-semibold rounded-lg transition ${
                  docenteSeleccionado && !loadingPDF
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {loadingPDF ? "Generando..." : "Generar constancia"}
              </button>

              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            </div>
          </div>

          <div className="lg:col-span-2 h-full">
            <div className="bg-white border rounded-xl shadow-sm p-4 h-full flex items-center justify-center">

              {loadingPDF && (
                <div className="w-full h-full animate-pulse bg-gray-200 rounded-lg" />
              )}

              {!loadingPDF && pdfUrl && (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full rounded-lg border"
                  title="Vista previa PDF"
                />
              )}

              {!loadingPDF && !pdfUrl && (
                <p className="text-gray-400 text-lg">
                  Genera una constancia para visualizarla aquí.
                </p>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CartaPDFViewer;
