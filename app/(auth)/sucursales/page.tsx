'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useAuth } from '@/app/context/auth-context';

type UUID = string;

interface Sucursal {
  id: UUID;
  nombre: string;
  plantel_id: UUID | null;
  plantel_nombre: string | null;
  seleccionado: boolean;
}

interface PlantelOpt {
  id: UUID;
  nombre_plantel: string;
}

const SucursalesList = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { rol } = useAuth();

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [plantelesFiltro, setPlantelesFiltro] = useState<PlantelOpt[]>([]);
  const [search, setSearch] = useState('');
  const [plantelFilter, setPlantelFilter] = useState<'Todos' | UUID>('Todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 7;

  useEffect(() => {
    const fetchSucursales = async () => {
      const { data, error } = await supabase
        .from('sucursales')
        .select(`
          id,
          nombre,
          plantel_id,
          plantel:plantel_id (
            id,
            nombre_plantel
          )
        `)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error al obtener sucursales:', error.message);
        return;
      }

      const normalizadas: Sucursal[] =
        (data || []).map((s: any) => ({
          id: s.id as UUID,
          nombre: s.nombre as string,
          plantel_id: s.plantel_id as UUID | null,
          plantel_nombre: s.plantel?.nombre_plantel ?? null,
          seleccionado: false,
        })) ?? [];

      setSucursales(normalizadas);

      const uniquesMap = new Map<UUID, string>();
      normalizadas.forEach((s) => {
        if (s.plantel_id && s.plantel_nombre) {
          uniquesMap.set(s.plantel_id, s.plantel_nombre);
        }
      });
      const opts: PlantelOpt[] = Array.from(uniquesMap.entries()).map(
        ([id, nombre_plantel]) => ({ id, nombre_plantel })
      );
      opts.sort((a, b) =>
        a.nombre_plantel.localeCompare(b.nombre_plantel, 'es', { sensitivity: 'base' })
      );
      setPlantelesFiltro(opts);
    };

    fetchSucursales();
  }, [supabase]);

  useEffect(() => {
    setPaginaActual(1);
  }, [search, plantelFilter]);

  const handleAgregar = () => router.push('/sucursales/registro');
  const handleEditar = (id: UUID) => router.push(`/sucursales/editar/${id}`);

  const handleEliminar = async (id: UUID) => {
    if (rol !== 'Administrador') return;

    const confirmado = window.confirm(
      '¡Espera! La acción es irreversible y podrá afectar otros registros en el sistema. ¿Deseas continuar?'
    );
    if (!confirmado) return;

    const { error } = await supabase.from('sucursales').delete().eq('id', id);
    if (error) {
      console.error('Error eliminando sucursal:', error.message);
      return;
    }
    setSucursales((prev) => prev.filter((s) => s.id !== id));
  };

  const handleEliminarSeleccionados = async () => {
    if (rol !== 'Administrador') return;

    const idsAEliminar = sucursales.filter((s) => s.seleccionado).map((s) => s.id);
    if (idsAEliminar.length === 0) return;

    const confirmado = window.confirm(
      '¡Espera! La acción es irreversible y podrá afectar otros registros en el sistema. ¿Deseas continuar?'
    );
    if (!confirmado) return;

    const { error } = await supabase.from('sucursales').delete().in('id', idsAEliminar);
    if (error) {
      console.error('Error eliminando sucursales seleccionadas:', error.message);
      return;
    }
    setSucursales((prev) => prev.filter((s) => !s.seleccionado));
  };

  const handleSeleccionar = (id: UUID) => {
    setSucursales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, seleccionado: !s.seleccionado } : s))
    );
  };

  const resultadosFiltrados = useMemo(() => {
    return sucursales.filter((s) => {
      const cumpleBusqueda = s.nombre.toLowerCase().includes(search.toLowerCase());
      const cumplePlantel =
        plantelFilter === 'Todos' ? true : s.plantel_id === plantelFilter;
      return cumpleBusqueda && cumplePlantel;
    });
  }, [sucursales, search, plantelFilter]);

  const totalPaginas = Math.ceil(resultadosFiltrados.length / registrosPorPagina);

  const resultadosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return resultadosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [resultadosFiltrados, paginaActual]);

  return (
    <div className="p-8 bg-gray-50 max-h-screen">
      <h1 className="text-3xl font-light text-center text-black-800 mb-6">
        Listado de sucursales
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Input
          placeholder="Buscar por nombre de sucursal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w"
        />

        <Select
          onValueChange={(v) => setPlantelFilter(v as 'Todos' | UUID)}
          value={plantelFilter}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por plantel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos los planteles</SelectItem>
            {plantelesFiltro.map((pl) => (
              <SelectItem key={pl.id} value={pl.id}>
                {pl.nombre_plantel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-nowrap gap-2 mb-4 overflow-x-auto">
        <Button
          className="bg-green-600 text-white flex items-center gap-2 whitespace-nowrap"
          onClick={handleAgregar}
        >
          Agregar sucursal
        </Button>

        <Button
          className={`bg-red-600 text-white flex items-center gap-2 whitespace-nowrap
            ${rol !== 'Administrador' ? 'opacity-50 pointer-events-auto' : ''}`
          }
          onClick={handleEliminarSeleccionados}
          title={
            rol !== 'Administrador'
              ? 'Función disponible únicamente para administradores'
              : 'Eliminar seleccionados'
          }
        >
          Eliminar seleccionados
        </Button>
      </div>

      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="p-3 text-left w-12"></th>
              <th className="p-3 text-center whitespace-nowrap">Plantel</th>
              <th className="p-3 text-center whitespace-nowrap">Nombre de la sucursal</th>
              <th className="p-3 text-center whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {resultadosPaginados.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No hay sucursales registradas...
                </td>
              </tr>
            ) : (
              resultadosPaginados.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={s.seleccionado}
                      onChange={() => handleSeleccionar(s.id)}
                    />
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    {s.plantel_nombre ?? '—'}
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">{s.nombre}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-yellow-400"
                        onClick={() => handleEditar(s.id)}
                        title="Editar"
                      >
                        <Edit2 size={20} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className={`text-red-600 cursor-pointer ${
                          rol !== 'Administrador' ? 'opacity-50 pointer-events-auto' : ''
                        }`}
                        onClick={() => rol === 'Administrador' && handleEliminar(s.id)}
                        title={
                          rol !== 'Administrador'
                            ? 'Función disponible únicamente para administradores'
                            : 'Eliminar'
                        }
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex justify-center mt-6 space-x-1">
          <button
            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaActual === 1}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            ←
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPaginaActual(i + 1)}
              className={`px-3 py-1 text-sm rounded-md border ${
                paginaActual === i + 1
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
            disabled={paginaActual === totalPaginas}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

export default SucursalesList;
