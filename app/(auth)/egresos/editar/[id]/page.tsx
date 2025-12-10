"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ThreeDot } from "react-loading-indicators";

const parseXMLFactura = async (file: File) => {
  return new Promise<{
    uuid?: string;
    fecha?: string;
    total?: string;
    descripcion?: string;
  } | null>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string;
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "application/xml");

        const findByLocalName = (name: string) => {
          const all = Array.from(xml.getElementsByTagName("*"));
          return all.find((el) => el.localName === name) || null;
        };

        const comprobante = findByLocalName("Comprobante");
        if (!comprobante) {
          return resolve(null);
        }

        const fechaAttr = comprobante.getAttribute("Fecha") || comprobante.getAttribute("fecha") || "";
        const totalAttr = comprobante.getAttribute("Total") || comprobante.getAttribute("total") || "";

        const timbre = findByLocalName("TimbreFiscalDigital");
        const uuid = timbre?.getAttribute("UUID") || timbre?.getAttribute("uuid") || "";

        const conceptos = Array.from(xml.getElementsByTagName("*")).filter((el) => el.localName === "Concepto");
        const descripciones = conceptos
          .map((c) => c.getAttribute("Descripcion") || c.getAttribute("descripcion") || "")
          .filter(Boolean)
          .join("\n");

        resolve({
          uuid: uuid || undefined,
          fecha: fechaAttr || undefined,
          total: totalAttr || undefined,
          descripcion: descripciones || undefined,
        });
      } catch (err) {
        console.error("Error parseando XML:", err);
        resolve(null);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};

const EditarFacturaProveedor: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();

  const facturaId = params?.id;

  const [planteles, setPlanteles] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [etiquetas, setEtiquetas] = useState<any[]>([]);

  const [folioFiscal, setFolioFiscal] = useState("");
  const [plantelId, setPlantelId] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");
  const [etiquetaId, setEtiquetaId] = useState("");
  const [fecha, setFecha] = useState("");
  const [observacion, setObservacion] = useState("");
  const [gasto, setGasto] = useState("");

  const [archivoXml, setArchivoXml] = useState<File | null>(null);
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);

  const [archivoXmlActual, setArchivoXmlActual] = useState<any>(null);
  const [archivoPdfActual, setArchivoPdfActual] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const cargarPlanteles = async () => {
      const { data } = await supabase
        .from("plantel")
        .select("id, nombre_plantel")
        .order("nombre_plantel");

      if (data) setPlanteles(data);
    };

    cargarPlanteles();
  }, [supabase]);

  useEffect(() => {
    const cargarFactura = async () => {
      if (!facturaId) return;

      const { data, error } = await supabase
        .from("factura_proveedores")
        .select("*")
        .eq("id", facturaId)
        .single();

      if (error || !data) {
        alert("No se encontró la factura.");
        router.push("/egresos");
        return;
      }

      setFolioFiscal(data.folio_fiscal || "");
      setPlantelId(data.plantel_id || "");
      setProveedorId(data.proveedor_id || "");
      setDepartamentoId(data.departamento || "");
      setEtiquetaId(data.etiqueta || "");
      setFecha(data.fecha ? String(data.fecha).substring(0, 10) : "");
      setObservacion(data.observacion || "");
      setGasto(data.gasto ? String(data.gasto) : "");

      const { data: archivos } = await supabase
        .from("factura_archivos_proveedor")
        .select("*")
        .eq("factura_id", facturaId);

      if (archivos && archivos.length > 0) {
        const xml = archivos.find((a) => a.nombre_unico?.toLowerCase().endsWith(".xml"));
        const pdf = archivos.find((a) => a.nombre_unico?.toLowerCase().endsWith(".pdf"));

        setArchivoXmlActual(xml || null);
        setArchivoPdfActual(pdf || null);
      }
    };

    cargarFactura();
  }, [facturaId, supabase, router]);

  useEffect(() => {
    const cargarRelacionados = async () => {
      if (!plantelId) {
        setProveedores([]);
        setEtiquetas([]);
        setDepartamentos([]);
        return;
      }

      const [{ data: proveedores }, { data: etiquetas }, { data: departamentos }] =
        await Promise.all([
          supabase
            .from("proveedores")
            .select("id, nombre_proveedor")
            .eq("plantel_id", plantelId)
            .order("nombre_proveedor"),

          supabase
            .from("etiquetas")
            .select("id, nombre_etiqueta")
            .eq("plantel_id", plantelId)
            .order("nombre_etiqueta"),

          supabase
            .from("departamentos")
            .select("id, nombre_departamento")
            .eq("plantel_id", plantelId)
            .order("nombre_departamento"),
        ]);

      if (proveedores) setProveedores(proveedores);
      if (etiquetas) setEtiquetas(etiquetas);
      if (departamentos) setDepartamentos(departamentos);
    };

    cargarRelacionados();
  }, [plantelId, supabase]);

  const handleXmlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";

    if (!file) return;

    setArchivoXml(file);

    const parsed = await parseXMLFactura(file);
    if (!parsed) {
      console.warn("XML no contiene datos esperados o no es CFDI estándar.");
      return;
    }

    if (parsed.uuid) setFolioFiscal(parsed.uuid);
    if (parsed.fecha) {
      const fechaIso = parsed.fecha.split("T")[0] || parsed.fecha;
      setFecha(fechaIso);
    }

    if (parsed.descripcion) {
    setObservacion(parsed.descripcion);
    }
    if (parsed.total) setGasto(parsed.total);
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (file) setArchivoPdf(file);
  };

  const handleActualizar = async () => {
    if (
      !folioFiscal.trim() ||
      !proveedorId ||
      !fecha ||
      !etiquetaId ||
      !observacion.trim() ||
      !gasto ||
      !departamentoId ||
      !plantelId
    ) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");

    try {
      const { error: updateError } = await supabase
        .from("factura_proveedores")
        .update({
          proveedor_id: proveedorId,
          fecha,
          etiqueta: etiquetaId,
          observacion,
          gasto: parseFloat(gasto),
          departamento: departamentoId,
          plantel_id: plantelId,
          folio_fiscal: folioFiscal.trim(),
        })
        .eq("id", facturaId);

      if (updateError) throw updateError;

      if (!archivoXml && !archivoPdf) {
        setSuccessMessage("Factura actualizada con éxito.");
        setTimeout(() => router.push("/egresos"), 1500);
        return;
      }

      const folioSanitizado = folioFiscal.trim().replace(/[^a-zA-Z0-9_-]/g, "");

      if (archivoXml && archivoXmlActual) {
        await supabase.storage
          .from("factura-egresos-proveedor")
          .remove([archivoXmlActual.nombre_unico]);

        await supabase
          .from("factura_archivos_proveedor")
          .delete()
          .eq("id", archivoXmlActual.id);
      }

      if (archivoPdf && archivoPdfActual) {
        await supabase.storage
          .from("factura-egresos-proveedor")
          .remove([archivoPdfActual.nombre_unico]);

        await supabase
          .from("factura_archivos_proveedor")
          .delete()
          .eq("id", archivoPdfActual.id);
      }

      const nuevosArchivos: any[] = [];

      if (archivoXml) {
        const nuevoNombreXml = `${folioSanitizado}_comprobante.xml`;

        await supabase.storage
          .from("factura-egresos-proveedor")
          .upload(nuevoNombreXml, archivoXml, { upsert: true });

        nuevosArchivos.push({
          factura_id: facturaId,
          path: nuevoNombreXml,
          nombre_unico: nuevoNombreXml,
          nombre_original: archivoXml.name,
        });
      }

      if (archivoPdf) {
        const nuevoNombrePdf = `${folioSanitizado}_factura.pdf`;

        await supabase.storage
          .from("factura-egresos-proveedor")
          .upload(nuevoNombrePdf, archivoPdf, { upsert: true });

        nuevosArchivos.push({
          factura_id: facturaId,
          path: nuevoNombrePdf,
          nombre_unico: nuevoNombrePdf,
          nombre_original: archivoPdf.name,
        });
      }

      if (nuevosArchivos.length > 0) {
        await supabase.from("factura_archivos_proveedor").insert(nuevosArchivos);
      }

      setSuccessMessage("Factura actualizada exitosamente.");
      setTimeout(() => router.push("/egresos"), 2000);
    } catch (error) {
      console.error(error);
      alert("Error actualizando: " + JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => router.push("/egresos");

  return (
    <div className="relative p-8 bg-white max-h-screen overflow-auto">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-40 z-50">
          <ThreeDot color="#2464ec" size="large" />
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-6">
        <span className="font-bold text-black">Facturas</span> | Editar factura de proveedor
      </h2>

      {successMessage && (
        <div className="p-4 mb-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <div className="border rounded shadow bg-white">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t">Datos de la factura</div>

        <div className="p-4 space-y-4">
          {/* ARCHIVOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Archivo XML:</label>
              {archivoXmlActual && (
                <p className="text-sm mt-1 text-gray-600">
                  Archivo actual: <strong>{archivoXmlActual.nombre_original}</strong>
                </p>
              )}
              <input
                type="file"
                accept=".xml"
                onChange={handleXmlChange}
                className="w-full p-2 border rounded bg-white"
              />
            </div>

            <div>
              <label className="font-medium">Archivo PDF:</label>
              {archivoPdfActual && (
                <p className="text-sm mt-1 text-gray-600">
                  Archivo actual: <strong>{archivoPdfActual.nombre_original}</strong>
                </p>
              )}
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handlePdfChange}
                className="w-full p-2 border rounded bg-white"
              />
            </div>
          </div>

          {/* CAMPOS */}
          <div>
            <label className="block font-medium">Folio Fiscal:</label>
            <input
              type="text"
              value={folioFiscal}
              onChange={(e) => setFolioFiscal(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium">Plantel:</label>
              <select
                value={plantelId}
                onChange={(e) => setPlantelId(e.target.value)}
                className="w-full p-2 border rounded"
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
              <label className="block font-medium">Proveedor:</label>
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={!plantelId}
              >
                <option value="">Seleccione un proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_proveedor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium">Fecha:</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* CLASIFICACIÓN / DEPTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Clasificación:</label>
              <select
                value={etiquetaId}
                onChange={(e) => setEtiquetaId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Seleccione una clasificación</option>
                {etiquetas.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.nombre_etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium">Departamento:</label>
              <select
                value={departamentoId}
                onChange={(e) => setDepartamentoId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Seleccione un departamento</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre_departamento}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* OBSERVACIÓN */}
          <div>
            <label className="block font-medium">Descripción:</label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          {/* IMPORTE */}
          <div>
            <label className="block font-medium">Importe:</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={gasto}
              onChange={(e) => setGasto(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleCancelar}
              className="bg-red-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              onClick={handleActualizar}
              className="bg-green-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarFacturaProveedor;
