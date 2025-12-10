"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/app/context/auth-context" 
import { useState, useEffect } from "react"
import {
  LogOut, Menu, X, Pen, Wallet, CalendarDays, Users2, Building, File, Slack, Library, Timer, FileSpreadsheet,
  LandPlot, FileBadge, Coins, PackageOpenIcon, FileDigit, CircleUserRoundIcon, ListCollapse, Handshake, MapPin,
  Ticket,
  MailWarning,
} from "lucide-react"

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [proveedorOpen, setProveedorOpen] = useState(false)
  const { rol } = useAuth() 
  const pathname = usePathname()

  const toggleSidebar = () => setIsOpen(!isOpen)

  const isActive = (path: string) => {
    if (!pathname) return false
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const handleSignOut = async () => {
    const { createClientComponentClient } = await import("@supabase/auth-helpers-nextjs")
    const supabase = createClientComponentClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const shouldScroll = adminOpen || proveedorOpen

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-[#0e2238] text-white rounded-md md:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0e2238] transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-4">
            <Link href="/dashboard">
              <img src="/uniciwhite.webp" alt="Logo UNICI" className="h-16 mx-auto cursor-pointer" />
            </Link>
          </div>

          <nav className={`flex-1 p-4 transition-all duration-300 ${shouldScroll ? "overflow-y-auto" : "overflow-hidden"}`}>
            <ul className="space-y-2">
              {[
                { href: "/dashboard", label: "Panel principal", icon: <Slack size={20} /> },
                { href: "/planteles", label: "Planteles", icon: <Building size={20} /> },
                { href: "/facturas", label: "Facturas", icon: <File size={20} /> },
                { href: "/conceptos", label: "Conceptos de pago", icon: <ListCollapse size={20} /> },
                { href: "/ofertas", label: "Ofertas Educativas", icon: <Library size={20} /> },
                { href: "/modulos", label: "Módulos", icon: <Pen size={20} /> },
                { href: "/cuentas", label: "Cuentas Bancarias", icon: <Wallet size={20} /> },
                { href: "/periodos", label: "Periodos de pago", icon: <CalendarDays size={20} /> },
                { href: "/docentes", label: "Docentes", icon: <Users2 size={20} /> },
                { href: "/historico", label: "Históricos de pago", icon: <Timer size={20} /> },
                { href: "/reportes", label: "Reportes de pago", icon: <FileSpreadsheet size={20} /> },
              ].map(({ href, label, icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 p-2 rounded-md transition-all text-white ${
                      isActive(href)
                        ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                        : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                    }`}
                  >
                    {icon}
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="pt-6 border-t border-white/20 mt-4">
              <details
                className="group transition-all duration-300 overflow-hidden"
                onToggle={(e) => setProveedorOpen((e.target as HTMLDetailsElement).open)}
              >
                <summary className="flex items-center justify-between p-2 rounded-md text-sm text-white hover:bg-white/10 hover:shadow-md transition-all cursor-pointer group-open:bg-white/10 group-open:shadow">
                  <span className="w-full text-left">Proveedores</span>
                  <span className="transform transition-transform duration-300 group-open:rotate-180">▼</span>
                </summary>
                <div className="transition-all duration-300 max-h-0 group-open:max-h-[500px]">
                  <ul className="space-y-2 pl-2 pt-2">
                    <li>
                      <Link
                        href="/proveedores"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/proveedores")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <PackageOpenIcon size={20} />
                        <span>Listado & registro</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/areas"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/areas")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <LandPlot size={20} />
                        <span>Áreas UNICI</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contratos"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/contratos")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <Handshake size={20} />
                        <span>Contrataciones</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/etiquetas"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/etiquetas")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <Coins size={20} />
                        <span>Etiquetas de gastos</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/sucursales"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/sucursales")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <MapPin size={20} />
                        <span>Sucursales UNICI</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/egresos"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/egresos")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <FileDigit size={20} />
                        <span>Facturas & listado</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/reportes-proveedor"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/reportes-proveedor")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <FileBadge size={20} />
                        <span>Reportes & filtrado</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </details>
            </div>

            <div className="pt-6 border-t border-white/20 mt-4">
              <details
                className="group transition-all duration-300 overflow-hidden"
                onToggle={(e) => setProveedorOpen((e.target as HTMLDetailsElement).open)}
              >
                <summary className="flex items-center justify-between p-2 rounded-md text-sm text-white hover:bg-white/10 hover:shadow-md transition-all cursor-pointer group-open:bg-white/10 group-open:shadow">
                  <span className="w-full text-left">Adquisición de bienes</span>
                  <span className="transform transition-transform duration-300 group-open:rotate-180">▼</span>
                </summary>
                <div className="transition-all duration-300 max-h-0 group-open:max-h-[500px]">
                  <ul className="space-y-2 pl-2 pt-2">
                    <li>
                      <Link
                        href="/tickets"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/proveedores")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <Ticket size={20} />
                        <span>Tickets solicitantes</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/pendientes"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/areas")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <MailWarning size={20} />
                        <span>Pendientes</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <Handshake size={20} />
                        <span>Seguimiento de flujo</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/etiquetas")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <Coins size={20} />
                        <span>Clasificación de gastos</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/sucursales"
                        className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                          isActive("/sucursales")
                            ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                            : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                        }`}
                      >
                        <MapPin size={20} />
                        <span>Sucursales UNICI</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </details>
            </div>
            

            {rol === "Administrador" && (
              <div className="pt-6 border-t border-white/20 mt-4">
                <button
                  onClick={() => setAdminOpen((prev) => !prev)}
                  className="flex items-center justify-between w-full text-sm p-2 rounded-md text-white hover:bg-white/10 hover:shadow-md transition-all"
                >
                  <span className="w-full text-left">Administradores</span>
                  <span className={`ml-2 transform transition-transform duration-300 ${adminOpen ? "rotate-180" : ""}`}>▼</span>
                </button>
                <ul
                  className={`space-y-2 pl-2 overflow-hidden transition-all duration-300 ease-in-out ${
                    adminOpen ? "max-h-[500px]" : "max-h-0"
                  }`}
                >
                  <li>
                    <Link
                      href="/admin/users"
                      className={`flex items-center gap-3 p-2 rounded-md text-white transition-all ${
                        isActive("/admin/users")
                          ? "bg-white/30 hover:bg-white/50 shadow-md translate-y-[-1px]"
                          : "hover:bg-white/10 hover:shadow-md hover:translate-y-[-1px]"
                      }`}
                    >
                      <CircleUserRoundIcon size={20} />
                      <span>Usuarios</span>
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </nav>

          <div className="p-4">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 p-2 w-full text-left text-red-600 rounded-md hover:bg-gray-200 hover:shadow-md hover:translate-y-[-1px]"
            >
              <LogOut size={20} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
