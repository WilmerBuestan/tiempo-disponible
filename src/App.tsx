import React, { useEffect, useRef, useState } from "react";
import { format, eachDayOfInterval } from "date-fns";
import "./App.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function App() {
  const calcularHitosPlanificacion = (horasTotales: number, fechaInicio: string, ajusteHoras: number = 1) => {
    const puntos = [0.2, 0.6, 0.8, 1.0];
    const fechaBase = new Date(fechaInicio);

    const hitos = puntos.map((p) => {
      const horas = p * horasTotales;
      const ms = horas * 60 * 60 * 1000;
      const fechaHito = new Date(fechaBase.getTime() + ms);
      const fechaAjustada = new Date(fechaHito.getTime() - ajusteHoras * 60 * 60 * 1000);

      return {
        porcentaje: `${(p * 100).toFixed(0)}%`,
        horas: decimalAHorasFormato(horas),
        horaCalculada: formatearMilitar(fechaHito.toISOString()),
        horaAjustada: formatearMilitar(fechaAjustada.toISOString()),
      };
    });

    return hitos;
  };

  const formatearMilitar = (fechaStr: string): string => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr);
    const dia = fecha.getDate().toString().padStart(2, "0");
    const hora = fecha.getHours().toString().padStart(2, "0");
    const minutos = fecha.getMinutes().toString().padStart(2, "0");

    const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear().toString().slice(-2);

    return `${dia}${hora}${minutos}${mes}${anio}`;
  };

  const decimalAHorasMinutos = (dec: number): string => {
    const horas = Math.floor(dec);
    const minutos = Math.round((dec - horas) * 60);
    const hh = horas.toString().padStart(2, "0");
    const mm = minutos.toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const decimalAHorasFormato = (dec: number): string => {
    const horas = Math.floor(dec);
    const minutos = Math.round((dec - horas) * 60);
    return `${horas}h${minutos.toString().padStart(2, "0")}m`;
  };

  const [seVive, setSeVive] = useState("");
  const [horaMision, setHoraMision] = useState("");
  const [icmn, setIcmn] = useState("");
  const [fcvn, setFcvn] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [totalHoras, setTotalHoras] = useState(0);
  const [error, setError] = useState("");
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const calcular = () => {
    if (!seVive || !horaMision || !icmn || !fcvn) {
      setResultados([]);
      setTotalHoras(0);
      setError("");
      return;
    }

    const inicio = new Date(seVive);
    const fin = new Date(horaMision);

    if (fin <= inicio) {
      setResultados([]);
      setTotalHoras(0);
      setError("La HORA MISIÓN debe ser posterior a SE VIVE.");
      return;
    }

    setError("");

    const listaDias = eachDayOfInterval({ start: inicio, end: fin });

    const [hICMN, mICMN] = icmn.split(":").map(Number);
    const [hFCVN, mFCVN] = fcvn.split(":").map(Number);
    const horaICMN = hICMN + mICMN / 60;
    const horaFCVN = hFCVN + mFCVN / 60;
    const horasLuzPorDia = horaFCVN - horaICMN;

    const resultadosTemp: any[] = [];
    let total = 0;

    listaDias.forEach((dia, index) => {
      let horasTotales = 24;
      let luz = horasLuzPorDia;
      let oscuridad = 24 - luz;

      const esUnicoDia = listaDias.length === 1;

      // Unico dia: inicio y fin caen en la misma fecha
      if (esUnicoDia) {
        const horaInicio = inicio.getHours() + inicio.getMinutes() / 60;
        const horaFin = fin.getHours() + fin.getMinutes() / 60;
        horasTotales = horaFin - horaInicio;

        const luzDesde = Math.max(horaInicio, horaICMN);
        const luzHasta = Math.min(horaFCVN, horaFin);
        luz = Math.max(0, luzHasta - luzDesde);
        oscuridad = horasTotales - luz;
      }

      // Primer dia
      else if (index === 0) {
        const horaInicio = inicio.getHours() + inicio.getMinutes() / 60;
        horasTotales = 24 - horaInicio;

        // Calcular luz solo si dentro del rango ICMN-FCVN
        const luzDesde = Math.max(horaInicio, horaICMN);
        const luzHasta = Math.max(Math.min(horaFCVN, 24), luzDesde); // evitar negativos
        luz = Math.max(0, luzHasta - luzDesde);
        oscuridad = horasTotales - luz;
      }

      // Ultimo dia
      else if (index === listaDias.length - 1) {
        const horaFin = fin.getHours() + fin.getMinutes() / 60;
        horasTotales = horaFin;

        // Luz si dentro del rango ICMN-FCVN
        const luzDesde = horaICMN;
        const luzHasta = Math.min(horaFCVN, horaFin);
        luz = Math.max(0, luzHasta - luzDesde);
        oscuridad = horasTotales - luz;
      }

      resultadosTemp.push({
        dia: format(dia, "yyyy-MM-dd"),
        luz: parseFloat(luz.toFixed(2)),
        oscuridad: parseFloat(oscuridad.toFixed(2)),
        total: parseFloat(horasTotales.toFixed(2)),
      });

      total += horasTotales;
    });

    setResultados(resultadosTemp);
    setTotalHoras(total);
  };

  // Recalcula automaticamente en cuanto los 4 campos estan completos: menos clics.
  useEffect(() => {
    calcular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seVive, horaMision, icmn, fcvn]);

  const limpiar = () => {
    setSeVive("");
    setHoraMision("");
    setIcmn("");
    setFcvn("");
    setResultados([]);
    setTotalHoras(0);
    setError("");
  };

  const generarPDF = async () => {
    const input = reportRef.current;
    if (!input || resultados.length === 0 || generandoPDF) return;

    setGenerandoPDF(true);

    // Se fuerza un ancho tipo "escritorio" durante la captura para que el PDF
    // no salga comprimido/ilegible cuando se genera desde una pantalla angosta.
    const anchoOriginal = input.style.width;
    input.style.width = "800px";

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    try {
      const canvas = await html2canvas(input, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let posicionY = 0;
      let alturaRestante = imgHeight;

      pdf.addImage(imgData, "JPEG", 0, posicionY, imgWidth, imgHeight);
      alturaRestante -= pageHeight;

      while (alturaRestante > 0) {
        posicionY = alturaRestante - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, posicionY, imgWidth, imgHeight);
        alturaRestante -= pageHeight;
      }

      const nombreArchivo = seVive ? `tiempo-disponible-${formatearMilitar(seVive)}.pdf` : "tiempo-disponible.pdf";
      pdf.save(nombreArchivo);
    } finally {
      input.style.width = anchoOriginal;
      setGenerandoPDF(false);
    }
  };

  const horasPlanificacion = Math.floor(totalHoras / 3);
  const hitos = resultados.length > 0 ? calcularHitosPlanificacion(horasPlanificacion, seVive, 1) : [];

  return (
    <div className="App">
      <header className="header">
        <h1>Cálculo de Tiempo Disponible</h1>
        <p className="subtitulo">Proceso de Liderazgo de Tropas (PLT)</p>
      </header>

      <section className="tarjeta form-tarjeta">
        <div className="form-grid">
          <div className="campo">
            <label htmlFor="seVive">SE VIVE (inicio)</label>
            <input id="seVive" type="datetime-local" value={seVive} onChange={(e) => setSeVive(e.target.value)} />
          </div>

          <div className="campo">
            <label htmlFor="horaMision">HORA MISIÓN (fin)</label>
            <input id="horaMision" type="datetime-local" value={horaMision} onChange={(e) => setHoraMision(e.target.value)} />
          </div>

          <div className="campo">
            <label htmlFor="icmn">ICMN</label>
            <input id="icmn" type="time" value={icmn} onChange={(e) => setIcmn(e.target.value)} />
          </div>

          <div className="campo">
            <label htmlFor="fcvn">FCVN</label>
            <input id="fcvn" type="time" value={fcvn} onChange={(e) => setFcvn(e.target.value)} />
          </div>
        </div>

        {error && <p className="mensaje-error">{error}</p>}

        <div className="acciones">
          <button type="button" className="boton boton-secundario" onClick={limpiar}>
            Limpiar
          </button>
          <button
            type="button"
            className="boton boton-primario"
            onClick={generarPDF}
            disabled={resultados.length === 0 || generandoPDF}
          >
            {generandoPDF ? "Generando PDF..." : "Descargar PDF"}
          </button>
        </div>
      </section>

      {resultados.length > 0 && (
        <div ref={reportRef} className="reporte">
          <table className="tabla-resultados">
            <thead>
              <tr>
                <th>Día</th>
                <th>Horas Luz</th>
                <th>Horas Oscuridad</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, idx) => (
                <tr key={idx}>
                  <td data-label="Día">{r.dia}</td>
                  <td data-label="Horas Luz">{decimalAHorasMinutos(r.luz)}</td>
                  <td data-label="Horas Oscuridad">{decimalAHorasMinutos(r.oscuridad)}</td>
                  <td data-label="Total">{decimalAHorasMinutos(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <section className="tarjeta">
            <h2>Resumen</h2>
            <dl className="lista-resumen">
              <div>
                <dt>Total horas</dt>
                <dd>{decimalAHorasMinutos(totalHoras)}</dd>
              </div>
              <div>
                <dt>Planificación (1/3)</dt>
                <dd>{decimalAHorasMinutos(totalHoras / 3)}</dd>
              </div>
              <div>
                <dt>Preparación y ejecución (2/3)</dt>
                <dd>{decimalAHorasMinutos((2 * totalHoras) / 3)}</dd>
              </div>
            </dl>
          </section>

          <section className="tarjeta">
            <h2>Preparación</h2>
            <dl className="lista-resumen">
              <div>
                <dt>Desde</dt>
                <dd>{formatearMilitar(seVive)}</dd>
              </div>
              <div>
                <dt>Hasta</dt>
                <dd>{formatearMilitar(horaMision)}</dd>
              </div>
              <div>
                <dt>Total hrs preparación</dt>
                <dd>{decimalAHorasMinutos(totalHoras)}</dd>
              </div>
              <div>
                <dt>Total hrs luz</dt>
                <dd>{decimalAHorasMinutos(resultados.reduce((sum, r) => sum + r.luz, 0))}</dd>
              </div>
              <div>
                <dt>Total hrs oscuridad</dt>
                <dd>{decimalAHorasMinutos(resultados.reduce((sum, r) => sum + r.oscuridad, 0))}</dd>
              </div>
              <div>
                <dt>1/3 Planificación Cía.</dt>
                <dd>{decimalAHorasMinutos(Math.floor(totalHoras / 3))}</dd>
              </div>
              <div>
                <dt>2/3 Preparación unidades subordinadas</dt>
                <dd>{decimalAHorasMinutos(totalHoras - Math.floor(totalHoras / 3))}</dd>
              </div>
            </dl>

            <h3>Hitos de planificación (basado en {horasPlanificacion} h = 1/3)</h3>
            <table className="tabla-resultados">
              <thead>
                <tr>
                  <th>%</th>
                  <th>Horas</th>
                  <th>Hora calculada</th>
                  <th>Hora ajustada (-1h)</th>
                </tr>
              </thead>
              <tbody>
                {hitos.map((h, idx) => (
                  <tr key={idx}>
                    <td data-label="%">{h.porcentaje}</td>
                    <td data-label="Horas">{h.horas}</td>
                    <td data-label="Hora calculada">{h.horaCalculada}</td>
                    <td data-label="Hora ajustada (-1h)">{h.horaAjustada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="tarjeta">
            <h2>Ejecución</h2>
            <dl className="lista-resumen">
              <div>
                <dt>Desde</dt>
                <dd>{formatearMilitar(horaMision)}</dd>
              </div>
              <div>
                <dt>Hasta</dt>
                <dd>______________________</dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      <footer className="footer">
        <p>Elaborado por: <strong>WilmerBuestan</strong></p>
        <p>Powered by: <strong>thegranwil</strong></p>
      </footer>
    </div>
  );
}

export default App;
