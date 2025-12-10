"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Props = {
  title?: string;
  subtitle?: string;
  showButton?: boolean;
  onBack?: () => void;
};

export default function EnConstruccion({
  title = "¡En Construcción!",
  subtitle = "Estamos trabajando para proporcionarte una mejor tecnología a tu alcance.",
  showButton = true,
  onBack,
}: Props) {
  const router = useRouter();

  function handleBack() {
    if (onBack) return onBack();
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen w-full flex flex-col bg-gray-50 overflow-hidden">

      <div className="flex flex-1 items-center justify-center px-6 lg:px-12 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 w-full overflow-hidden">

          <section className="space-y-6 flex flex-col justify-center overflow-hidden">
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {title}
            </h1>

            <p className="text-slate-600 text-xl max-w-lg">{subtitle}</p>

            {showButton && (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 transition-transform text-white font-medium shadow-md w-fit"
              >
                Volver al inicio
              </button>
            )}

            <div className="mt-4 w-full max-w bg-orange-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500 animate-progress"
                style={{ width: "57%" }}
              />
            </div>

            <div className="flex gap-3 mt-2 text-sm text-slate-500">
              <span>UNICI | 2025</span>
              <span>•</span>
              <span>Todos los derechos reservados.</span>
            </div>
          </section>

          <aside className="flex items-center justify-center overflow-hidden">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 overflow-hidden">

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <svg
                  viewBox="0 0 120 120"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="hc1" x1="0" x2="1">
                      <stop offset="0" stopColor="#F97316" />
                      <stop offset="1" stopColor="#F97316" />
                    </linearGradient>
                  </defs>

                  <g transform="translate(10,12)">
                    <path
                      d="M20 30 C10 30 5 28 5 20 C5 12 20 8 40 8 C60 8 75 12 75 20 C75 28 70 30 60 30 Z"
                      fill="url(#hc1)"
                      stroke="#F97316"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="12"
                      y="24"
                      width="50"
                      height="6"
                      rx="3"
                      fill="#fff"
                      opacity="0.12"
                    />
                  </g>

                  <g transform="translate(68,56) scale(0.95)">
                    <path
                      d="M12 2 L2 38 L22 38 Z"
                      fill="#F97316"
                      stroke="#F97316"
                      strokeWidth="1"
                    />
                    <rect
                      x="3"
                      y="24"
                      width="18"
                      height="4"
                      fill="#fff"
                      opacity="0.9"
                      rx="1"
                    />
                    <rect
                      x="4"
                      y="30"
                      width="16"
                      height="3"
                      fill="#fff"
                      opacity="0.6"
                      rx="1"
                    />
                  </g>

                  <g stroke="#F97316" opacity="0.25" strokeWidth="2">
                    <line x1="6" y1="90" x2="114" y2="90" />
                    <line x1="6" y1="96" x2="114" y2="96" />
                  </g>
                </svg>

                <p className="mt-4 font-semibold text-slate-800">Mejoras en curso</p>
                <p className="text-xs text-slate-500">Interfaz, rendimiento y seguridad</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            transform: translateX(-10%);
          }
          to {
            transform: translateX(0%);
          }
        }
        .animate-progress {
          animation: progress 2.5s ease-in-out infinite alternate;
        }
      `}</style>
    </main>
  );
}
