import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { membretebase64 } from "./membretebase64";
import { SupabaseClient } from '@supabase/supabase-js';

const meses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
const decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];

const numeroATexto = (num: number): string => {
  if (num === 0) return "cero";
  if (num < 10) return unidades[num];
  if (num >= 10 && num < 20) return especiales[num - 10];
  if (num === 20) return "veinte";
  if (num > 20 && num < 30) return "veinti" + unidades[num - 20];
  if (num === 30) return "treinta";
  if (num === 31) return "treinta y uno";
  return "";
};

const anioATexto = (anio: number): string => {
  if (anio < 2000 || anio > 2099) return anio.toString();
  const mil = "dos mil";
  const resto = anio - 2000;
  if (resto === 0) return mil;
  if (resto < 10) return `${mil} ${unidades[resto]}`;
  if (resto < 20) return `${mil} ${especiales[resto - 10]}`;
  const dec = Math.floor(resto / 10);
  const uni = resto % 10;
  return uni === 0 ? `${mil} ${decenas[dec]}` : `${mil} ${decenas[dec]} y ${unidades[uni]}`;
};

const formatearFecha = (fechaStr: string | null) => {
  if (!fechaStr) return "Sin fecha";
  const fecha = new Date(fechaStr);
  return `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
};

const limpiarTexto = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-zA-Z0-9.,:;()¿?¡!&@ \n]/g, "");

interface DocenteRelation {
  asignatura_id: string;
  oferta_educativa_id: string;
  periodo_pago_id: string;
}

function centerTextX(doc: jsPDF, text: string, margenIzquierdo: number, maxTextWidth: number) {
  const textWidth = doc.getTextWidth(text);
  return margenIzquierdo + (maxTextWidth - textWidth) / 2;
}

export async function generateCartaPDF(
  docenteSeleccionado: string,
  nombreDocente: string,
  supabase: SupabaseClient
): Promise<Blob> {
  
  const { data: relations, error } = await supabase
    .from("docente_relations")
    .select("*")
    .eq("docente_id", docenteSeleccionado);

  if (error || !relations) {
    throw new Error(error?.message || "Error al obtener relaciones");
  }

  const detalles = await Promise.all(
    relations.map(async (rel: DocenteRelation) => {
      const [{ data: asignatura }, { data: oferta }, { data: periodo }] = await Promise.all([
        supabase.from("asignatura").select("nombre_asignatura").eq("id", rel.asignatura_id).single(),
        supabase.from("oferta_educativa").select("nombre_oferta").eq("id", rel.oferta_educativa_id).single(),
        supabase.from("asignatura").select("fecha_inicio, fecha_fin").eq("id", rel.asignatura_id).single()
      ]);

      return {
        nivel: limpiarTexto(oferta?.nombre_oferta || "Sin nivel"),
        asignatura: limpiarTexto(asignatura?.nombre_asignatura || "Sin asignatura"),
        fecha: limpiarTexto(`${formatearFecha(periodo?.fecha_inicio)} al ${formatearFecha(periodo?.fecha_fin)}`)
      };
    })
  );

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  doc.addImage(membretebase64, "PNG", 0, 0, 612, 792);

  const fecha = new Date();
  const margenDerecho = 80;
  const margenIzquierdo = 80;
  const xDerecha = doc.internal.pageSize.getWidth() - margenDerecho;
  const baseY = 170;
  const maxTextWidth = xDerecha - margenIzquierdo;

  doc.setFont("helvetica", "bold").setFontSize(12);
  const fechaFormateada = `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
  doc.text(fechaFormateada, xDerecha, 100, { align: "right" });
  doc.text("Tuxtla Gutiérrez, Chiapas", xDerecha, 120, { align: "right" });

  doc.setFontSize(14);
  doc.text("A QUIEN CORRESPONDA", margenIzquierdo, baseY);
  doc.setFontSize(12);
  doc.text("PRESENTE", margenIzquierdo, baseY + 20);
  doc.text("Asunto: Carta de Recomendación", xDerecha, baseY + 45, { align: "right" });

  const texto1 = "El que suscribe Director(a) de la Universidad Internacional del Conocimiento e Investigación, S.C.";
  const texto2 = "HACE CONSTAR";
  const texto3 = `Que el C. ${limpiarTexto(nombreDocente)} es docente de esta institución por contratación directa de servicios profesionales y ha impartido las siguientes materias:`;

  doc.setFont("helvetica", "normal");

  let y = baseY + 75;
  const lineHeight = 14;

  doc.setFontSize(11);
  const texto1Ajustado = doc.splitTextToSize(texto1, maxTextWidth);
  doc.text(texto1Ajustado, margenIzquierdo, y);
  y += texto1Ajustado.length * lineHeight;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(texto2, margenIzquierdo, y + 10);
  y += lineHeight + 10;

  doc.setFont("helvetica", "normal");
  const texto3Ajustado = doc.splitTextToSize(texto3, maxTextWidth);
  doc.text(texto3Ajustado, margenIzquierdo, y);
  y += texto3Ajustado.length * lineHeight;

  autoTable(doc, {
    startY: y + 10,
    head: [["Nivel Educativo", "Módulo", "Fecha"]],
    body: detalles.map((d) => [d.nivel, d.asignatura, d.fecha]),
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle",
      halign: "center"
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: 0,
      fontStyle: "bold",
      halign: "center"
    },
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "center" },
      2: { halign: "center" }
    },
    margin: { left: margenIzquierdo, right: margenDerecho },
    tableWidth: xDerecha - margenIzquierdo,
  });

  const finalY = (doc as any).lastAutoTable.finalY || (y + 200);

  const diaTexto = numeroATexto(fecha.getDate());
  const mes = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();
  const anioTexto = anioATexto(anio);

  const textoExtiende = `Se extiende a los ${diaTexto} días del mes de ${mes} del año ${anioTexto}.`;
  const xCentered = centerTextX(doc, textoExtiende, margenIzquierdo, maxTextWidth);
  doc.text(textoExtiende, xCentered, finalY + 30);

  const firmaXCenter = margenIzquierdo + maxTextWidth / 2;

  doc.setFont("helvetica", "normal");
  doc.text("Atentamente", firmaXCenter - doc.getTextWidth("Atentamente") / 2, finalY + 80);

  const firmaTextos = [
    "________________________",
    "MATI. MARTHA EDITH GONZÁLEZ BRAVO",
    "DIRECTORA DEL PLANTEL"
  ];

  firmaTextos.forEach((texto, i) => {
    const yFirma = finalY + 150 + i * 25;
    doc.text(texto, firmaXCenter - doc.getTextWidth(texto) / 2, yFirma);
  });

  return doc.output("blob");
}
