import jsPDF from "jspdf";

const getImageDimensions = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 60, height: 60 }); // fallback si no carga
    img.src = dataUrl;
  });

const toBase64 = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return null;
  }
};
function slugify(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

export const generarPDFMultiple = async (jugadores) => {
  const doc = new jsPDF();

  for (let i = 0; i < jugadores.length; i++) {
    const j = jugadores[i];
    if (i > 0) doc.addPage();

    // ENCABEZADO
    try {
      const logo = await toBase64("/logo.png");
      if (logo) {
        doc.setFillColor(230, 230, 230);
        doc.rect(0, 0, 210, 30, "F");
        doc.addImage(logo, "PNG", 10, 5, 20, 20);
      }
    } catch {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(`${j.equipo.toUpperCase()} – ${j.apodo.toUpperCase()}`, 105, 20, { align: "center" });
    doc.setDrawColor(200, 0, 0);
    doc.setLineWidth(0.7);
    doc.line(60, 23, 150, 23);

    // IMAGEN JUGADOR
    try {
      const imgJugador = await toBase64(
        j.imagen ? `${import.meta.env.VITE_API_URL}${j.imagen}` : "/fotos/avatar-blank.png"
      );
      if (imgJugador) {
        const { width, height } = await getImageDimensions(imgJugador);
        const scale = 60 / Math.max(width, height);
        doc.addImage(imgJugador, "PNG", 20, 35, width * scale, height * scale);
      }
    } catch {}

    // IMAGEN POSICIÓN
    try {
      const slug = j.posicion_principal
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .replace(/[^\w-]/g, "");
      const imgCroquis = await toBase64(`/posiciones/${slugify(j.posicion_principal)}.png`);
      if (imgCroquis) {
        const { width, height } = await getImageDimensions(imgCroquis);
        const scale = 60 / Math.max(width, height);
        doc.addImage(imgCroquis, "PNG", 130, 35, width * scale, height * scale);
      }
    } catch {}

    // DATOS
    const datos = [
      ["Nombre", j.nombre_completo],
      ["DNI", j.dni],
      ["Seguridad Social", j.seguridad_social],
      ["Teléfono", j.telefono],
      ["Email", j.email],
      ["Fecha nacimiento", new Date(j.fecha_nacimiento).toLocaleDateString()],
      ["Ciudad", j.ciudad],
      ["Dirección", j.direccion_postal],
      ["Código Postal", j.codigo_postal],
      ["Posición", j.posicion_principal],
      ["Lateralidad", j.lateralidad],
    ];

    let y = 105;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setDrawColor(200);

    for (const [label, value] of datos) {
      doc.setFillColor(245, 245, 245);
      doc.rect(20, y, 50, 8, "F");
      doc.rect(70, y, 120, 8);
      doc.setTextColor(80);
      doc.text(label, 22, y + 6);
      doc.setTextColor(20);
      doc.text(String(value).toUpperCase(), 72, y + 6);
      y += 9;
    }

    // FOOTER
    doc.setFontSize(10);
    doc.setTextColor(130);
    doc.text(
      "Documento generado por la Coordinación de Cantera de Unionistas de Salamanca CF",
      105,
      285,
      { align: "center" }
    );
  }

  doc.save(`PDFJugadoresSeleccionados.pdf`);
};