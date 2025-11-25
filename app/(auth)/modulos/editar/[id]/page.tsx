'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ThreeDot } from 'react-loading-indicators';

const EditarAsignatura: React.FC = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();

  const asignaturaId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [nombreAsignatura, setNombreAsignatura] = useState('');
  const [plantelId, setPlantelId] = useState('');
  const [ofertaId, setOfertaId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [planteles, setPlanteles] = useState<{ id: string; nombre: string }[]>([]);
  const [ofertas, setOfertas] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchDatos = async () => {
      if (!asignaturaId) return;

      setLoading(true);

      const { data: asignatura, error } = await supabase
        .from('asignatura')
        .select('nombre_asignatura, plantel_id, oferta_educativa_id, fecha_inicio, fecha_fin')
        .eq('id', asignaturaId)
        .single();

      if (error || !asignatura) {
        console.error('Error al cargar el módulo:', error?.message);
        alert('Error al cargar el módulo.');
        router.push('/modulos');
        return;
      }

      setNombreAsignatura(asignatura.nombre_asignatura);
      setPlantelId(asignatura.plantel_id);
      setOfertaId(asignatura.oferta_educativa_id);
      setFechaInicio(asignatura.fecha_inicio?.split('T')[0]);
      setFechaFin(asignatura.fecha_fin?.split('T')[0]);

      const { data: plantelesData } = await supabase
        .from('plantel')
        .select('id, nombre_plantel');

      if (plantelesData) {
        setPlanteles(plantelesData.map(p => ({ id: p.id, nombre: p.nombre_plantel })));
      }

      setLoading(false);
    };

    fetchDatos();
  }, [asignaturaId]);

  useEffect(() => {
    const fetchOfertas = async () => {
      if (!plantelId) {
        setOfertas([]);
        return;
      }

      const { data, error } = await supabase
        .from('oferta_educativa')
        .select('id, nombre_oferta')
        .eq('plantel_id', plantelId);

      if (!error && data) {
        setOfertas(data.map(o => ({ id: o.id, nombre: o.nombre_oferta })));
      }
    };

    fetchOfertas();
  }, [plantelId]);

  const handleGuardar = async () => {
    if (!nombreAsignatura.trim() || !plantelId || !ofertaId || !fechaInicio || !fechaFin) {
      alert('Debe completar todos los campos.');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('asignatura')
      .update({
        nombre_asignatura: nombreAsignatura,
        plantel_id: plantelId,
        oferta_educativa_id: ofertaId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      })
      .eq('id', asignaturaId);

    setLoading(false);

    if (error) {
      console.error('Error actualizando el módulo:', error);
      alert('Error actualizando el módulo.');
      return;
    }

    setSuccessMessage('Módulo actualizado con éxito!');
    setTimeout(() => router.push('/modulos'), 2000);
  };

  const handleCancelar = () => {
    router.push('/modulos');
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
        <span className="font-bold text-black">Módulos</span> | Editar módulos
      </h2>

      <div className="border rounded shadow bg-white">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t">
          Datos del módulo a editar
        </div>

        <div className="p-4">
          <label className="block mb-2 font-medium">Plantel asociado:</label>
          <select
            value={plantelId}
            onChange={e => setPlantelId(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          >
            <option value="">Selecciona un plantel</option>
            {planteles.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <label className="block mb-2 font-medium">Oferta educativa:</label>
          <select
            value={ofertaId}
            onChange={e => setOfertaId(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading || !plantelId}
          >
            <option value="">Selecciona una oferta educativa</option>
            {ofertas.map(o => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>

          <label className="block mb-2 font-medium">Nombre del módulo:</label>
          <input
            type="text"
            value={nombreAsignatura}
            onChange={e => setNombreAsignatura(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          />

          <label className="block mb-2 font-medium">Fecha de inicio:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            disabled={loading}
          />

          <label className="block mb-2 font-medium">Fecha de fin:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
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

export default EditarAsignatura;
