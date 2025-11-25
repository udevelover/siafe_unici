"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { RotateCcw } from "lucide-react";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: {
    rol: string;
  } | null;
  seleccionado: boolean;
}

const UserManagementView: React.FC = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos los roles");

  const [mensajeReset, setMensajeReset] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select(`
          id,
          nombre,
          email,
          rol:rol_id (rol)
        `);

      if (error) {
        console.error("Error al obtener usuarios:", error.message);
        return;
      }

      const usuariosTransformados = (data || []).map((usuario: any) => ({
        ...usuario,
        rol: Array.isArray(usuario.rol) ? usuario.rol[0] || null : usuario.rol,
        seleccionado: false,
      }));

      setUsuarios(usuariosTransformados);
    };

    fetchUsuarios();
  }, [supabase]);

  const handleSeleccionar = (id: string) => {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, seleccionado: !u.seleccionado } : u
      )
    );
  };

  const handleEliminarSeleccionados = () => {
    setUsuarios((prev) => prev.filter((u) => !u.seleccionado));
  };

  const handleEditar = (id: string) => {
    router.push(`/admin/users/editar/${id}`);
  };

  const handleEliminar = (id: string) => {
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
  };

  // ----------------------------------------
  // 🔥 RESTABLECER CONTRASEÑA
  // ----------------------------------------
  const handleEnviarReset = async (email: string) => {
    setMensajeReset(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://siafe.herramientasunici.com/reset-password",
    });

    if (error) {
      setMensajeReset("Error al enviar correo: " + error.message);
      return;
    }

    setMensajeReset(`Correo enviado a ${email}`);
  };

  const filteredUsers = usuarios.filter((user) => {
    const roleName = user.rol?.rol || "Sin rol";
    return (
      (roleFilter === "Todos los roles" || roleName === roleFilter) &&
      (user.nombre.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="p-8 bg-gray-50 max-h-screen">
      <h1 className="text-3xl font-light text-center text-black-800 mb-6">
        Gestión de usuarios
      </h1>

      {mensajeReset && (
        <div className="mb-4 p-3 text-center bg-blue-100 text-blue-700 rounded">
          {mensajeReset}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Input
          placeholder="Buscar usuarios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w"
        />
        <Select onValueChange={setRoleFilter} value={roleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos los roles">Todos los roles</SelectItem>
            <SelectItem value="Administrador">Administrador</SelectItem>
            <SelectItem value="Usuario">Usuario</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-nowrap gap-2 mb-6 overflow-x-auto">
        <Button
          className="bg-green-600 text-white flex items-center gap-2 whitespace-nowrap"
          onClick={() => router.push("/admin/users/registro")}
        >
          + Agregar Usuario
        </Button>
        <Button
          className="bg-red-600 text-white flex items-center gap-2 whitespace-nowrap"
          onClick={handleEliminarSeleccionados}
        >
          Eliminar seleccionados
        </Button>
      </div>

      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="p-3 text-left w-12"></th>
              <th className="p-3 text-center whitespace-nowrap">Nombre de usuario</th>
              <th className="p-3 text-center whitespace-nowrap">Correo electrónico</th>
              <th className="p-3 text-center whitespace-nowrap">Rol asignado</th>
              <th className="p-3 text-center whitespace-nowrap">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No hay usuarios registrados...
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={user.seleccionado}
                      onChange={() => handleSeleccionar(user.id)}
                    />
                  </td>

                  <td className="p-3 text-center whitespace-nowrap">{user.nombre}</td>
                  <td className="p-3 text-center whitespace-nowrap">{user.email}</td>

                  <td className="p-3 text-center whitespace-nowrap">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm inline-block">
                      {user.rol?.rol ?? "Sin rol"}
                    </span>
                  </td>

                  <td className="p-3 text-center flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-yellow-400"
                      onClick={() => handleEditar(user.id)}
                      title="Editar"
                    >
                      <Pencil size={20} />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="text-blue-600"
                      onClick={() => handleEnviarReset(user.email)}
                      title="Restablecer contraseña"
                    >
                      <RotateCcw size={20} />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-600"
                      onClick={() => handleEliminar(user.id)}
                      title="Eliminar"
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
    </div>
  );
};

export default UserManagementView;
