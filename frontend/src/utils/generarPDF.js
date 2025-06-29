import jsPDF from "jspdf";
function slugify(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

export const generarPDF = async (jugador) => {
  const doc = new jsPDF();

  // ENCABEZADO
  const logo = await toBase64("/logo.png");
  if (logo) {
    doc.setFillColor(230, 230, 230);
    doc.rect(0, 0, 210, 30, "F");
    doc.addImage(logo, "PNG", 10, 5, 20, 20);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(`${jugador.equipo.toUpperCase()} – ${jugador.apodo.toUpperCase()}`, 105, 20, { align: "center" });

  doc.setDrawColor(200, 0, 0);
  doc.setLineWidth(0.7);
  doc.line(60, 23, 150, 23);

  // IMAGEN DEL JUGADOR
  let imagenJugadorUrl = jugador.imagen
    ? `${import.meta.env.VITE_API_URL}${jugador.imagen}`
    : "/fotos/avatar-blank.png";

  const imgJugador = await toBase64(imagenJugadorUrl);
  if (imgJugador) {
    try {
      const { width, height } = await getImageDimensions(imgJugador);
      const scale = 60 / Math.max(width, height);
      const newW = width * scale;
      const newH = height * scale;
      doc.addImage(imgJugador, "PNG", 20, 35, newW, newH, undefined, "SLOW");
    } catch (e) {
      console.error("Foto jugador corrupta:", e);
    }
  }

  // IMAGEN POSICIÓN
  const slug = jugador.posicion_principal
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^\w-]/g, "");

  const imgCroquis = await toBase64(`/posiciones/${slugify(jugador.posicion_principal)}.png`);
  if (imgCroquis) {
    try {
      const { width, height } = await getImageDimensions(imgCroquis);
      const scale = 60 / Math.max(width, height);
      const newW = width * scale;
      const newH = height * scale;
      doc.addImage(imgCroquis, "PNG", 130, 35, newW, newH, undefined, "SLOW");
    } catch (e) {
      console.error("Croquis corrupto:", e);
    }
  }

  // DATOS PERSONALES
  const datos = [
    ["Nombre", jugador.nombre_completo],
    ["DNI", jugador.dni],
    ["Seguridad Social", jugador.seguridad_social],
    ["Teléfono", jugador.telefono],
    ["Email", jugador.email],
    ["Fecha nacimiento", new Date(jugador.fecha_nacimiento).toLocaleDateString()],
    ["Ciudad", jugador.ciudad],
    ["Dirección", jugador.direccion_postal],
    ["Código Postal", jugador.codigo_postal],
    ["Posición", jugador.posicion_principal],
    ["Lateralidad", jugador.lateralidad],
  ];

  let startY = 105;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setDrawColor(200);

  for (const [label, value] of datos) {
    doc.setFillColor(245, 245, 245);
    doc.rect(20, startY, 50, 8, "F");
    doc.rect(70, startY, 120, 8);
    doc.setTextColor(80);
    doc.text(label, 22, startY + 6);
    doc.setTextColor(20);
    doc.text(String(value).toUpperCase(), 72, startY + 6);
    startY += 9;
  }

  // PIE DE PÁGINA
  doc.setFontSize(10);
  doc.setTextColor(130);
  doc.text(
    "Documento generado por la Coordinación de Cantera de Unionistas de Salamanca CF",
    105,
    285,
    { align: "center" }
  );

  doc.save(`${jugador.apodo}_${jugador.equipo}.pdf`);
};

// 🔄 Convertir imagen a base64
const toBase64 = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Error al convertir imagen a base64:", url, err);
    return null;
  }
};

// 📐 Obtener dimensiones reales de una imagen base64
const getImageDimensions = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = dataUrl;
  });