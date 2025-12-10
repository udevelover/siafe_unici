'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Edit2, Trash2, FileText, FileImage, File } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';  
import { Input } from '@/components/ui/input';   
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/app/context/auth-context';

interface Factura {
  id: string;
  folio: string;
  fecha_pago: string;
  mes_pago: string;
  importe: number;
  forma_pago: string;
  docente_relations: {
    asignatura: { nombre_asignatura: string };
    oferta_educativa: { nombre_oferta: string };
    periodo_pago_id: { concatenado: string };
    plantel: { id: string; nombre_plantel: string };
    docente: { nombre_docente: string };
  } | null;
  cuenta_banco_id: { banco: string } | null;
  concepto_pago_id: { descripcion: string } | null;
  facturas_archivos: {
    path: string;
    nombre_original: string;
    nombre_unico: string;
  }[];
  seleccionado?: boolean;
}

const FacturaList = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [planteles, setPlanteles] = useState<{ id: string; nombre: string }[]>([]);
  const [search, setSearch] = useState('');
  const [filtroPlantel, setFiltroPlantel] = useState('Todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 7;

  const supabase = createClientComponentClient();
  const router = useRouter();
  const { rol } = useAuth();

  const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const formatFechaPago = (fechaPago: string) => {
    if (!fechaPago) return '';
    const fechaStr = fechaPago.split('T')[0];
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const opciones: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return capitalizar(fecha.toLocaleDateString('es-MX', opciones));
  };


  const formatMesPago = (mesPago: string) => {
    const [year, month] = mesPago.split('-').map(Number);
    if (!year || !month) return '';
    const fecha = new Date(year, month - 1, 1);
    const opciones: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
    };
    return capitalizar(fecha.toLocaleDateString('es-MX', opciones));
  };

  useEffect(() => {
    const fetchPlanteles = async () => {
      const { data, error } = await supabase.from('plantel').select('id, nombre_plantel');
      if (error) {
        console.error('Error al obtener planteles:', error.message);
        return;
      }
      const plantelesMapeados = [{ id: 'Todos', nombre: 'Todos los planteles' }, ...(data ?? []).map(p => ({ id: p.id, nombre: p.nombre_plantel }))];
      setPlanteles(plantelesMapeados);
    };

    const fetchFacturas = async () => {
      const { data, error } = await supabase
        .from('factura')
        .select(`
          id,
          folio,
          fecha_pago,
          mes_pago,
          importe,
          forma_pago,
          docente_relations (
            asignatura(nombre_asignatura),
            oferta_educativa(nombre_oferta),
            periodo_pago_id(concatenado),
            plantel(id, nombre_plantel),
            docente(nombre_docente)
          ),
          cuenta_banco_id (banco),
          concepto_pago_id (descripcion),
          facturas_archivos(path, nombre_original, nombre_unico)
        `);

      if (error) {
        console.error('Error al obtener facturas:', error.message);
        return;
      }

      const facturasFormateadas = (data ?? []).map((factura: any) => ({
        ...factura,
        seleccionado: false,
        docente_relation: factura.docente_relations && factura.docente_relations.length > 0 ? {
          asignatura: factura.docente_relations[0].asignatura?.[0] ?? { nombre_asignatura: '' },
          oferta_educativa: factura.docente_relations[0].oferta_educativa?.[0] ?? { nombre_oferta: '' },
          periodo_pago_id: factura.docente_relations[0].periodo_pago_id?.[0] ?? { concatenado: '' },
          plantel: factura.docente_relations[0].plantel?.[0] ?? { id: '', nombre_plantel: '' },
          docente: factura.docente_relations[0].docente?.[0] ?? { nombre_docente: '' },
        } : null,
        cuenta_banco: factura.cuenta_banco_id && factura.cuenta_banco_id.length > 0 ? factura.cuenta_banco_id[0] : null,
        concepto_pago: factura.concepto_pago_id && factura.concepto_pago_id.length > 0 ? factura.concepto_pago_id[0] : null,
      }));

      setFacturas(facturasFormateadas);
    };

    fetchPlanteles();
    fetchFacturas();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [search, filtroPlantel]);

  const handleAgregar = () => {
    router.push('/facturas/registro');
  };

  const handleEditar = (id: string) => {
    router.push(`/facturas/editar/${id}`);
  };

  const handleEliminar = async (id: string) => {
    if (rol !== 'Administrador') return;

    const confirmado = window.confirm('¿Estás seguro que quieres eliminar esta factura?');
    if (!confirmado) return;

    const { error } = await supabase.from('factura').delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar factura:', error.message);
      alert('Ocurrió un error al eliminar la factura.');
      return;
    }

    setFacturas(prev => prev.filter(f => f.id !== id));
  };

  const handleEliminarSeleccionados = async () => {
    if (rol !== 'Administrador') return;

    const idsAEliminar = facturas.filter(f => f.seleccionado).map(f => f.id);
    if (idsAEliminar.length === 0) {
      alert('No hay facturas seleccionadas.');
      return;
    }

    const confirmado = window.confirm(`¿Eliminar ${idsAEliminar.length} facturas seleccionadas?`);
    if (!confirmado) return;

    const { error } = await supabase.from('factura').delete().in('id', idsAEliminar);
    if (error) {
      console.error('Error al eliminar facturas:', error.message);
      alert('Ocurrió un error al eliminar las facturas.');
      return;
    }

    setFacturas(prev => prev.filter(f => !idsAEliminar.includes(f.id)));
  };

  const handleSeleccionar = (id: string) => {
    setFacturas(prev =>
      prev.map(f => (f.id === id ? { ...f, seleccionado: !f.seleccionado } : f))
    );
  };

  const abrirArchivo = async (archivoPath: string) => {
    const { data, error } = await supabase.storage
      .from('facturas')
      .createSignedUrl(archivoPath, 60 * 60);
    if (!error && data) {
      window.open(data.signedUrl, '_blank');
    } else {
      alert('No se pudo abrir el archivo.');
      console.error('Error al obtener URL firmada:', error?.message);
    }
  };

  const resultadosFiltrados = facturas.filter(f => {
    const textoBusqueda = search.toLowerCase();
    const coincideBusqueda = f.folio.toLowerCase().includes(textoBusqueda);
    const coincidePlantel = filtroPlantel === 'Todos' || f.docente_relations?.plantel.id === filtroPlantel;
    return coincideBusqueda && coincidePlantel;
  });

  const totalPaginas = Math.ceil(resultadosFiltrados.length / registrosPorPagina);
  const resultadosPaginados = resultadosFiltrados.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  return (
    <div className="p-8 bg-gray-50 max-h-screen">
      <h1 className="text-3xl text-center font-light text-black-800 mb-6">Listado de facturas</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Input
          placeholder="Buscar por número de folio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />

        <Select value={filtroPlantel} onValueChange={setFiltroPlantel}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por plantel" />
          </SelectTrigger>
          <SelectContent>
            {planteles.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-nowrap gap-2 mb-4 overflow-x-auto">
        <Button
          onClick={handleAgregar}
          className="bg-green-600 text-white flex items-center gap-2 whitespace-nowrap"
        >
          Agregar factura
        </Button>

        <Button
          onClick={handleEliminarSeleccionados}
          className={`bg-red-600 text-white flex items-center gap-2 whitespace-nowrap
            ${rol !== 'Administrador' ? 'bg-red-600 opacity-50 pointer-events-none' : 'bg-red-600 hover:bg-red-700'}
          `}
          title={rol !== 'Administrador' ? 'Solo administradores' : 'Eliminar seleccionados'}
        >
          Eliminar seleccionados
        </Button>
      </div>

      <div className="rounded shadow bg-white overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="p-3"></th>
              <th className="p-3 text-center text-nowrap">Folio</th>
              <th className="p-3 text-center text-nowrap">Plantel asociado</th>
              <th className="p-3 text-center text-nowrap">Nombre del docente</th>
              <th className="p-3 text-center text-nowrap">Oferta educativa</th>
              <th className="p-3 text-center text-nowrap">Módulo correspondiente</th>
              <th className="p-3 text-center text-nowrap">Periodo de pago</th>
              <th className="p-3 text-center text-nowrap">Concepto de pago</th>
              <th className="p-3 text-center text-nowrap">Fecha de pago</th>
              <th className="p-3 text-center text-nowrap">Mes de pago</th>
              <th className="p-3 text-center text-nowrap">Forma de pago</th>
              <th className="p-3 text-center text-nowrap">Institución bancaria</th>
              <th className="p-3 text-center text-nowrap">Importe pagado</th>
              <th className="p-3 text-center text-nowrap">Documentos</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {resultadosPaginados.length === 0 ? (
              <tr>
                <td colSpan={15} className="p-4 text-center text-gray-500">
                  No hay facturas registradas...
                </td>
              </tr>
            ) : (
              resultadosPaginados.map(factura => (
                <tr key={factura.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={factura.seleccionado || false}
                      onChange={() => handleSeleccionar(factura.id)}
                    />
                  </td>
                  <td className="p-3 text-center">{factura.folio}</td>
                  <td className="p-3 text-center text-nowrap">{factura.docente_relations?.plantel.nombre_plantel || ''}</td>
                  <td className="p-3 text-center text-nowrap">{factura.docente_relations?.docente.nombre_docente || ''}</td>
                  <td className="p-3 text-center text-nowrap">{factura.docente_relations?.oferta_educativa.nombre_oferta || ''}</td>
                  <td className="p-3 text-center text-nowrap">{factura.docente_relations?.asignatura.nombre_asignatura || ''}</td>
                  <td className="p-3 text-center text-nowrap">{factura.docente_relations?.periodo_pago_id.concatenado || ''}</td>
                  <td className="p-3 text-center text-nowrap">{factura.concepto_pago_id?.descripcion || ''}</td>
                  <td className="p-3 text-center text-nowrap">{formatFechaPago(factura.fecha_pago)}</td>
                  <td className="p-3 text-center text-nowrap">{formatMesPago(factura.mes_pago)}</td>
                  <td className="p-3 text-center text-nowrap">{factura.forma_pago}</td>
                  <td className="p-3 text-center text-nowrap">
                    {factura.cuenta_banco_id?.banco || 'NO APLICA'}
                  </td>
                  <td className="p-3 text-center text-nowrap">${factura.importe.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    {factura.facturas_archivos.length > 0 ? (
                      factura.facturas_archivos.map((archivo) => {
                        const ext = archivo.nombre_unico.split('.').pop()?.toLowerCase();
                        const Icon = ext === 'pdf' ? FileText :
                                     ['jpg','jpeg','png'].includes(ext || '') ? FileImage : File;
                        return (
                          <button
                            key={archivo.nombre_unico}
                            onClick={() => abrirArchivo(archivo.path)}
                            className="text-blue-600 hover:underline mr-2"
                            title={archivo.nombre_original}
                            type="button"
                          >
                            <Icon size={16} />
                          </button>
                        );
                      })
                    ) : (
                      <span>No hay archivos</span>
                    )}
                  </td>
                  <td className="p-3 text-center flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-yellow-400"
                      onClick={() => handleEditar(factura.id)}
                      title="Editar"
                    >
                      <Edit2 size={20} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`text-red-600 ${rol !== 'Administrador' ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => rol === 'Administrador' && handleEliminar(factura.id)}
                      title={rol !== 'Administrador' ? 'Solo administradores' : 'Eliminar'}
                    >
                      <Trash2 size={20} />
                    </Button>
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
            onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
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
            onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
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

export default FacturaList;
