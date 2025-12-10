'use client'

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const RegistroFactura: React.FC = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [folio, setFolio] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [mesPago, setMesPago] = useState('');
  const [importePago, setImportePago] = useState('');
  const [formaPago, setFormaPago] = useState('');
  const [planteles, setPlanteles] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [relaciones, setRelaciones] = useState<any[]>([]);
  const [relacionId, setRelacionId] = useState<string>('');
  const [plantelId, setPlantelId] = useState('');
  const [docenteId, setDocenteId] = useState('');
  const [bancoId, setBancoId] = useState('');
  const [conceptoId, setConceptoId] = useState('');

  const [archivos, setArchivos] = useState<{
    facturaFile: File | null;
    xmlFile: File | null;
    comprobantePagoFile: File | null;
  }>({
    facturaFile: null,
    xmlFile: null,
    comprobantePagoFile: null,
  });

  const archivosRequeridos = useMemo(() => [
    { key: 'facturaFile', label: 'Factura (PDF)', accept: '.pdf' },
    { key: 'xmlFile', label: 'Archivo XML', accept: '.xml' },
    { key: 'comprobantePagoFile', label: 'Comprobante de pago (JPG, PDF)', accept: '.pdf,.jpg,.jpeg,.png' },
  ], []);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      const { data } = await supabase.from('plantel').select('id, nombre_plantel');
      setPlanteles(data || []);
    };
    cargarDatosIniciales();
  }, [supabase]);

  useEffect(() => {
    if (!plantelId) return setDocentes([]);

    supabase
      .from('docente_relations')
      .select(`
        id,
        docente_id,
        docente:docente_id (nombre_docente)
      `)
      .eq('plantel_id', plantelId)
      .then(({ data }) => {
        if (data) setDocentes(data);
      });

    setDocenteId('');
  }, [plantelId, supabase]);

  useEffect(() => {
    if (!plantelId) {
      setBancos([]);
      setBancoId('');
      return;
    }

    supabase
      .from('cuenta_banco')
      .select('id, banco')
      .eq('plantel_id', plantelId)
      .then(({ data }) => {
        if (data) setBancos(data);
      });

    setBancoId('');
  }, [plantelId, supabase]);

  useEffect(() => {
    if (!plantelId) {
      setConceptos([]);
      setConceptoId('');
      return;
    }

    supabase
      .from('concepto_pago')
      .select('id, descripcion')
      .eq('plantel_id', plantelId)
      .then(({ data }) => {
        if (data) setConceptos(data);
      });

    setConceptoId('');
  }, [plantelId, supabase]);

  useEffect(() => {
    if (!plantelId || !docenteId) {
      setRelaciones([]);
      setRelacionId('');
      return;
    }

    const fetchRelaciones = async () => {
      const { data, error } = await supabase
        .from('docente_relations')
        .select(`
          id,
          asignatura_id,
          asignatura:asignatura_id (nombre_asignatura),
          oferta_educativa_id,
          oferta_educativa:oferta_educativa_id (nombre_oferta),
          periodo_pago_id,
          periodo_pago:periodo_pago_id (concatenado)
        `)
        .eq('plantel_id', plantelId)
        .eq('docente_id', docenteId);

      if (error) {
        console.error('Error:', error);
      } else if (!data || data.length === 0) {
        alert('No se encontraron relaciones para el docente en este plantel.');
        setRelaciones([]);
        setRelacionId('');
      } else {
        setRelaciones(data);
        setRelacionId('');
      }
    };

    fetchRelaciones();
  }, [plantelId, docenteId, supabase]);

  useEffect(() => {
    if (formaPago !== 'TRANSFERENCIA') {
      setBancoId('');
    }
  }, [formaPago]);

  const handleArchivoChange = (key: keyof typeof archivos, file: File | null) => {
    setArchivos(prev => ({ ...prev, [key]: file }));
  };

  const handleGuardar = async () => {
    if (
      !folio || !fechaPago || !mesPago || !importePago || !formaPago ||
      !plantelId || !docenteId ||
      (formaPago === 'TRANSFERENCIA' && !bancoId) ||
      !conceptoId || !relacionId ||
      !archivos.facturaFile || !archivos.xmlFile || !archivos.comprobantePagoFile
    ) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    try {
      const { data: facturaData, error: facturaError } = await supabase
        .from('factura')
        .insert([{
          folio,
          fecha_pago: fechaPago,
          mes_pago: mesPago,
          importe: parseFloat(importePago),
          forma_pago: formaPago,
          plantel_id: plantelId || null,
          docente_id: docenteId || null,
          cuenta_banco_id: formaPago === 'TRANSFERENCIA' ? bancoId : null,
          concepto_pago_id: conceptoId || null,
          docente_relation_id: relacionId || null,
        }])
        .select('id')
        .single();

      if (facturaError) {
        alert('Error al registrar la factura: ' + facturaError.message);
        return;
      }

      const facturaId = facturaData.id;

      const archivosParaSubir = [
        { file: archivos.xmlFile, tipo: 'XML', extension: 'xml' },
        { file: archivos.facturaFile, tipo: 'Factura', extension: 'pdf' },
        { file: archivos.comprobantePagoFile, tipo: 'Comprobante', extension: 'pdf' }
      ];

      for (const archivo of archivosParaSubir) {
        if (!archivo.file) continue;

        const nombreOriginal = archivo.file.name;
        const nombreUnico = `${folio}_${archivo.tipo}.${archivo.extension}`;
        const ruta = `${archivo.tipo}/${nombreUnico}`;

        const { data: existeArchivo } = await supabase
          .storage
          .from('facturas')
          .list(archivo.tipo, { search: nombreUnico });

        const yaExiste = existeArchivo?.some(f => f.name === nombreUnico);

        if (!yaExiste) {
          const { error: uploadError } = await supabase.storage
            .from('facturas')
            .upload(ruta, archivo.file, { upsert: true });

          if (uploadError) {
            alert(`Error al subir archivo ${archivo.tipo}: ` + uploadError.message);
            return;
          }
        }

        const { error: insertArchivoError } = await supabase
          .from('facturas_archivos')
          .insert([{
            factura_id: facturaId,
            path: ruta,
            nombre_original: nombreOriginal,
            nombre_unico: nombreUnico,
          }]);

        if (insertArchivoError) {
          alert(`Error al registrar archivo ${archivo.tipo}: ` + insertArchivoError.message);
          return;
        }
      }

      alert('Factura registrada con éxito.');
      router.push('/facturas');

    } catch (e: any) {
      alert('Error inesperado: ' + e.message);
    }
  };

  const handleCancelar = () => {
    router.push('/facturas');
  };

  const docentesUnicos = Array.from(
    new Map(docentes.map((d) => [d.docente_id, d])).values()
  );

  return (
    <div className="p-8 bg-gray-50 max-h-screen">
      <div className="flex items-center mb-6">
        <Button
          onClick={() => router.back()}
          className="bg-white text-black-800 border hover:bg-gray-100 mr-4 p-2 rounded-full"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <h2 className="text-2xl font-semibold text-gray-800">
          Facturas | Registro de Facturas
        </h2>
      </div>

      <div className="max-w-9xl mx-auto bg-white border rounded-xl shadow-sm">
        <div className="bg-blue-600 text-white px-6 py-3 rounded-t-xl text-lg font-semibold">
          Datos de la factura
        </div>
        <div className="px-6 py-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Folio:</label>
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Ingrese el número de folio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plantel:</label>
              <select
                value={plantelId}
                onChange={(e) => setPlantelId(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Seleccione una opción</option>
                {planteles.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.nombre_plantel}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Docente:</label>
              <select
                value={docenteId}
                onChange={(e) => setDocenteId(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Seleccione una opción</option>
                {docentesUnicos.map((opt) => (
                  <option key={opt.docente_id} value={opt.docente_id}>
                    {opt.docente?.nombre_docente}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relación:</label>
              <select
                value={relacionId}
                onChange={(e) => setRelacionId(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Seleccione una opción</option>
                {relaciones.map((rel) => (
                  <option key={rel.id} value={rel.id}>
                    {rel.asignatura?.nombre_asignatura} | {rel.oferta_educativa?.nombre_oferta} | {rel.periodo_pago?.concatenado}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de pago:</label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes de pago:</label>
              <input
                type="month"
                value={mesPago}
                onChange={(e) => setMesPago(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Importe de pago:</label>
              <input
                type="number"
                value={importePago}
                onChange={(e) => setImportePago(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pago:</label>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Seleccione una forma</option>
                <option value="ABONO A COLEGIATURA">ABONO A COLEGIATURA</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="EFECTIVO">EFECTIVO</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>

            {formaPago === 'TRANSFERENCIA' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banco:</label>
                <select
                  value={bancoId}
                  onChange={(e) => setBancoId(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Seleccione una opción</option>
                  {bancos.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.banco}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto de pago:</label>
              <select
                value={conceptoId}
                onChange={(e) => setConceptoId(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Seleccione una opción</option>
                {conceptos.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.descripcion}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {archivosRequeridos.map(({ key, label, accept }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
                <input
                  type="file"
                  accept={accept}
                  onChange={(e) => handleArchivoChange(key as keyof typeof archivos, e.target.files?.[0] || null)}
                  className={`w-full border p-2 rounded ${
                    !archivos[key as keyof typeof archivos] ? 'border-red-500' : ''
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-8">
            <button
              onClick={handleCancelar}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Cancelar
            </button>

            <button
              onClick={handleGuardar}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Guardar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegistroFactura;
