import React, { useState } from "react";
import { format, eachDayOfInterval } from "date-fns";
import "./App.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function App() {


  const calcularHitosPlanificacion = (horasTotales: number, fechaInicio: string, ajusteHoras: number = 1) => {
    const puntos = [0.2, 0.6, 0.8, 1.0];
    const fechaBase = new Date(fechaInicio);
  
    const hitos = puntos.map(p => {
      const horas = p * horasTotales;
      const ms = horas * 60 * 60 * 1000;
      const fechaHito = new Date(fechaBase.getTime() + ms);
      const fechaAjustada = new Date(fechaHito.getTime() - ajusteHoras * 60 * 60 * 1000);
  
      return {
        porcentaje: `${(p * 100).toFixed(0)}%`,
        horas: horas.toFixed(2),
        horaCalculada: formatearMilitar(fechaHito.toISOString()),
        horaAjustada: formatearMilitar(fechaAjustada.toISOString())
      };
    });
  
    return hitos;
  };
  


  const generarPDF = () => {
    const input = document.querySelector(".App");
    if (!input) return;
  
    html2canvas(input as HTMLElement, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("tiempo-disponible.pdf");
    });
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


  const [seVive, setSeVive] = useState("");
  const [horaMision, setHoraMision] = useState("");
  const [icmn, setIcmn] = useState("");
  const [fcvn, setFcvn] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [totalHoras, setTotalHoras] = useState(0);





  

  const calcular = () => {

 




    if (!seVive || !horaMision || !icmn || !fcvn) return;
  
    const inicio = new Date(seVive);
    const fin = new Date(horaMision);
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
  
      // Primer día
      if (index === 0) {
        const horaInicio = inicio.getHours() + inicio.getMinutes() / 60;
        horasTotales = 24 - horaInicio;
  
        // Calcular luz solo si dentro del rango ICMN–FCVN
        const luzDesde = Math.max(horaInicio, horaICMN);
        const luzHasta = Math.max(Math.min(horaFCVN, 24), luzDesde); // evitar negativos
        luz = Math.max(0, luzHasta - luzDesde);
        oscuridad = horasTotales - luz;
      }
  
      // Último día
      else if (index === listaDias.length - 1) {
        const horaFin = fin.getHours() + fin.getMinutes() / 60;
        horasTotales = horaFin;
  
        // Luz si dentro del rango ICMN–FCVN
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
  

  return (
    <div className="App" style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <div className="header">
  <h1>CÁLCULO DE TIEMPO DISPONIBLE - PLT</h1>
</div>

      
      
      <h2>Cálculo de Tiempo Disponible</h2>

      <div style={{ marginBottom: 20 }}>
        <div>
          <label>SE VIVE (Inicio): </label>
          <input type="datetime-local" value={seVive} onChange={(e) => setSeVive(e.target.value)} />
        </div>

        <div>
          <label>HORA MISIÓN (Fin): </label>
          <input type="datetime-local" value={horaMision} onChange={(e) => setHoraMision(e.target.value)} />
        </div>

        <div>
  <label>ICMN: </label>
  <input type="time" value={icmn} onChange={(e) => setIcmn(e.target.value)} />
</div>

<div>
  <label>FCVN: </label>
  <input type="time" value={fcvn} onChange={(e) => setFcvn(e.target.value)} />
</div>


        <button onClick={calcular} style={{ marginTop: "1rem" }}>Calcular</button>
        <button onClick={generarPDF} style={{ marginLeft: "1rem" }}>Descargar PDF</button>

     
      </div>

      {resultados.length > 0 && (
        <div>
          <table border={1} cellPadding={8} style={{ marginBottom: 20 }}>
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
                  <td>{r.dia}</td>
                  <td>{decimalAHorasMinutos(r.luz)}</td>
<td>{decimalAHorasMinutos(r.oscuridad)}</td>
<td>{decimalAHorasMinutos(r.total)}</td>

                </tr>
              ))}
            </tbody>
          </table>

          <h3>Resumen</h3>
<p>Total Horas: {decimalAHorasMinutos(totalHoras)}</p>
<p>Planificación (1/3): {decimalAHorasMinutos(totalHoras / 3)}</p>
<p>Preparación y Ejecución (2/3): {decimalAHorasMinutos((2 * totalHoras) / 3)}</p>

          <div className="bloque">
          <h3>PREPARACIÓN</h3>
          <p><strong>Desde:</strong> {formatearMilitar(seVive)}</p>
<p><strong>Hasta:</strong> {formatearMilitar(horaMision)}</p>

  <p><strong>Total hrs preparación:</strong> {decimalAHorasMinutos(totalHoras)}</p>
  <p><strong>Total hrs luz:</strong> {decimalAHorasMinutos(resultados.reduce((sum, r) => sum + r.luz, 0))}</p>
  <p><strong>Total hrs oscuridad:</strong> {decimalAHorasMinutos(resultados.reduce((sum, r) => sum + r.oscuridad, 0))}</p>
<p><strong>1/3 Planificación Cía:</strong> {decimalAHorasMinutos(Math.floor(totalHoras / 3))}</p>
<p><strong>2/3 Actividades de preparación con las unidades subordinadas:</strong> {decimalAHorasMinutos(totalHoras - Math.floor(totalHoras / 3))}</p>

{(() => {
  const horasPlanificacion = Math.floor(totalHoras / 3); // 1/3 como base
  const hitos = calcularHitosPlanificacion(horasPlanificacion, seVive, 1); // ajuste de 1 hora

  return (
    <div className="bloque">
      <h3>Hitos de Planificación (basado en {horasPlanificacion} h = 1/3)</h3>
      <table>
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
              <td>{h.porcentaje}</td>
              <td>{h.horas}</td>
              <td>{h.horaCalculada}</td>
              <td>{h.horaAjustada}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
})()}





</div>

<div className="bloque">
  <h3>EJECUCIÓN</h3>
  <p><strong>Desde:</strong> {formatearMilitar(horaMision)}</p>
  <p><strong>Hasta:</strong> ______________________</p>
</div>


        
        
        </div>
      )}

      
<div className="footer">
  <p>Elaborado por: <strong>WilmerBuestan</strong></p>
  <p>Powered by: <strong>thegranwil</strong></p>
</div>
    </div>




  );
}

export default App;
