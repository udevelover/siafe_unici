'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const EditarDocente: React.FC = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();
  const docenteId = params?.id as string;

  const [planteles, setPlanteles] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [asignaturas, setAsignaturas] = useState<any[]>([]);
  const [importeActual, setImporteActual] = useState('');

  const [plantelId, setPlantelId] = useState('');
  const [plantelNombre, setPlantelNombre] = useState('');

  const [nombreDocente, setNombreDocente] = useState('');

  const [selecciones, setSelecciones] = useState<any[]>([]);

  const [ofertaId, setOfertaId] = useState('');
  const [ofertaNombre, setOfertaNombre] = useState('');

  const [asignaturaId, setAsignaturaId] = useState('');
  const [asignaturaNombre, setAsignaturaNombre] = useState('');

  const [periodoPago, setPeriodoPago] = useState('');
  const [periodoNombre, setPeriodoNombre] = useState('');

  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    supabase.from('plantel').select('id, nombre_plantel').order('nombre_plantel')
      .then(({ data }) => setPlanteles(data || []));
  }, []);

  useEffect(() => {
    if (!plantelId) return setPeriodos([]);
    supabase.from('periodo_pago')
      .select('id, concatenado')
      .eq('plantel_id', plantelId)
      .order('concatenado')
      .then(({ data }) => setPeriodos(data || []));
  }, [plantelId]);

  useEffect(() => {
    if (!plantelId) return setOfertas([]);
    supabase.from('oferta_educativa')
      .select('id, nombre_oferta')
      .eq('plantel_id', plantelId)
      .order('nombre_oferta')
      .then(({ data }) => setOfertas(data || []));
  }, [plantelId]);

  useEffect(() => {
    if (!ofertaId) return setAsignaturas([]);
    supabase.from('asignatura')
      .select('id, nombre_asignatura')
      .eq('oferta_educativa_id', ofertaId)
      .order('nombre_asignatura')
      .then(({ data }) => setAsignaturas(data || []));
  }, [ofertaId]);

  useEffect(() => {
    if (loadingData) return;
    if (selecciones.length === 0) return;

    const sel = selecciones[0];

    if (sel.importe_total_pago) {
      setImporteActual(sel.importe_total_pago.toString());
    }
  }, [selecciones, loadingData]);

  useEffect(() => {
    if (!docenteId) return;

    const cargarDatos = async () => {
      const { data: docenteData } = await supabase
        .from('docente')
        .select('id, nombre_docente')
        .eq('id', docenteId)
        .single();

      if (docenteData) {
        setNombreDocente(docenteData.nombre_docente);
      }

      const { data: relaciones } = await supabase
        .from('docente_relations')
        .select(`
          id,
          plantel_id,
          plantel:plantel_id(nombre_plantel),
          oferta_educativa_id,
          oferta:oferta_educativa_id(nombre_oferta),
          asignatura_id,
          asignatura:asignatura_id(nombre_asignatura),
          periodo_pago_id,
          periodo:periodo_pago_id(concatenado),
          importe_total_pago
        `)
        .eq('docente_id', docenteId);

      if (relaciones && relaciones.length > 0) {
        const r0 = relaciones[0];

        setPlantelId(r0.plantel_id);
        setPlantelNombre(r0.plantel?.[0]?.nombre_plantel || '');

        setSelecciones(
          relaciones.map((r: any) => ({
            id: r.id,
            plantel_id: r.plantel_id,
            plantelNombre: r.plantel?.nombre_plantel || '',
            oferta_educativa_id: r.oferta_educativa_id,
            ofertaNombre: r.oferta?.nombre_oferta || '',
            asignatura_id: r.asignatura_id,
            asignaturaNombre: r.asignatura?.nombre_asignatura || '',
            periodo_pago_id: r.periodo_pago_id,
            periodoNombre: r.periodo?.concatenado || '',
            importe_total_pago: r.importe_total_pago,
          }))
        );
      }

      setLoadingData(false);
    };

    cargarDatos();
  }, [docenteId]);

  useEffect(() => {
    if (loadingData) return;
    if (selecciones.length === 0) return;

    const sel = selecciones[0];

    if (ofertas.length > 0) {
      setOfertaId(sel.oferta_educativa_id);
      setOfertaNombre(sel.ofertaNombre);
    }

  }, [ofertas, loadingData]);

  useEffect(() => {
    if (loadingData) return;
    if (selecciones.length === 0) return;

    const sel = selecciones[0];

    if (asignaturas.length > 0) {
      setAsignaturaId(sel.asignatura_id);
      setAsignaturaNombre(sel.asignaturaNombre);
    }

  }, [asignaturas, loadingData]);

  useEffect(() => {
    if (loadingData) return;
    if (selecciones.length === 0) return;

    const sel = selecciones[0];

    if (periodos.length > 0) {
      setPeriodoPago(sel.periodo_pago_id);
      setPeriodoNombre(sel.periodoNombre);
    }

  }, [periodos, loadingData]);

  const agregarSeleccion = () => {
    if (!ofertaId || !asignaturaId || !periodoPago) {
      alert('Debes seleccionar una oferta educativa, asignatura y período.');
      return;
    }
    if (!importeActual.trim()) {
      alert('Debes ingresar un importe válido.');
      return;
    }

    const importeParsed = parseFloat(importeActual);
    if (isNaN(importeParsed) || importeParsed <= 0) {
      alert('El importe debe ser positivo.');
      return;
    }

    const duplicado = selecciones.some(s =>
      s.oferta_educativa_id === ofertaId &&
      s.asignatura_id === asignaturaId &&
      s.periodo_pago_id === periodoPago
    );

    if (duplicado) {
      alert('Esta relación ya fue agregada.');
      return;
    }

    setSelecciones([
      ...selecciones,
      {
        plantel_id: plantelId,
        plantelNombre,
        oferta_educativa_id: ofertaId,
        ofertaNombre,
        asignatura_id: asignaturaId,
        asignaturaNombre,
        periodo_pago_id: periodoPago,
        periodoNombre,
        importe_total_pago: importeParsed
      }
    ]);

    setOfertaId('');
    setOfertaNombre('');
    setAsignaturaId('');
    setAsignaturaNombre('');
    setPeriodoPago('');
    setPeriodoNombre('');
    setImporteActual('');
  };

  const eliminarSeleccion = (index: number) => {
    setSelecciones(selecciones.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    if (!plantelId || !nombreDocente.trim() || selecciones.length === 0) {
      alert('Todos los campos son obligatorios.');
      return;
    }

    const { error: updateError } = await supabase
      .from('docente')
      .update({ nombre_docente: nombreDocente })
      .eq('id', docenteId);

    if (updateError) {
      console.error(updateError);
      alert('Error actualizando docente.');
      return;
    }

    await supabase.from('docente_relations').delete().eq('docente_id', docenteId);

    const nuevasRelaciones = selecciones.map(s => ({
      docente_id: docenteId,
      plantel_id: s.plantel_id,
      oferta_educativa_id: s.oferta_educativa_id,
      asignatura_id: s.asignatura_id,
      periodo_pago_id: s.periodo_pago_id,
      importe_total_pago: s.importe_total_pago
    }));

    const { error: relError } = await supabase.from('docente_relations').insert(nuevasRelaciones);

    if (relError) {
      console.error(relError);
      alert('Docente actualizado pero falló asignación.');
    } else {
      alert('Docente actualizado correctamente.');
      router.push('/docentes');
    }
  };

  return (
    <div className="p-8 bg-white-100">
      <div className="flex items-center mb-6">
        <Button onClick={() => router.back()} className="bg-white text-black-800 border hover:bg-gray-100 mr-4 p-2 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-semibold">Docentes | Editar Docente</h2>
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-medium">Plantel</label>
        <select
          className="border p-2 rounded w-full"
          value={plantelId}
          onChange={e => {
            setPlantelId(e.target.value);
            const nombre = planteles.find(p => p.id === e.target.value)?.nombre_plantel || '';
            setPlantelNombre(nombre);
          }}
        >
          <option value="">Seleccione un plantel</option>
          {planteles.map(p => (
            <option key={p.id} value={p.id}>{p.nombre_plantel}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-medium">Nombre del docente</label>
        <input
          type="text"
          className="border p-2 rounded w-full"
          value={nombreDocente}
          onChange={e => setNombreDocente(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">

        <select
          className="border p-2 rounded"
          value={ofertaId}
          onChange={e => {
            setOfertaId(e.target.value);
            const nombre = ofertas.find(o => o.id === e.target.value)?.nombre_oferta || '';
            setOfertaNombre(nombre);
          }}
        >
          <option value="">Seleccione una oferta educativa</option>
          {ofertas.map(o => (
            <option key={o.id} value={o.id}>{o.nombre_oferta}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={asignaturaId}
          onChange={e => {
            setAsignaturaId(e.target.value);
            const nombre = asignaturas.find(a => a.id === e.target.value)?.nombre_asignatura || '';
            setAsignaturaNombre(nombre);
          }}
        >
          <option value="">Seleccione una asignatura</option>
          {asignaturas.map(a => (
            <option key={a.id} value={a.id}>{a.nombre_asignatura}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={periodoPago}
          onChange={e => {
            setPeriodoPago(e.target.value);
            const nombre = periodos.find(p => p.id === e.target.value)?.concatenado || '';
            setPeriodoNombre(nombre);
          }}
        >
          <option value="">Seleccione un período</option>
          {periodos.map(p => (
            <option key={p.id} value={p.id}>{p.concatenado}</option>
          ))}
        </select>

        <input
          type="number"
          step="0.01"
          className="border p-2 rounded"
          placeholder="Importe"
          value={importeActual}
          onChange={e => setImporteActual(e.target.value)}
        />

        <Button onClick={agregarSeleccion} className="bg-blue-500 text-white">
          Agregar
        </Button>
      </div>

      <table className="w-full border mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Plantel</th>
            <th className="p-2 border">Oferta Educativa</th>
            <th className="p-2 border">Asignatura</th>
            <th className="p-2 border">Período</th>
            <th className="p-2 border">Importe</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {selecciones.map((s, i) => (
            <tr key={i}>
              <td className="p-2 border text-center">{s.plantelNombre}</td>
              <td className="p-2 border text-center">{s.ofertaNombre}</td>
              <td className="p-2 border text-center">{s.asignaturaNombre}</td>
              <td className="p-2 border text-center">{s.periodoNombre}</td>
              <td className="p-2 border text-center">{s.importe_total_pago}</td>
              <td className="p-2 border text-center">
                <Button
                  variant="destructive"
                  onClick={() => eliminarSeleccion(i)}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button onClick={handleGuardar} className="bg-green-500 text-white">
        Guardar cambios
      </Button>
    </div>
  );
};

export default EditarDocente;
