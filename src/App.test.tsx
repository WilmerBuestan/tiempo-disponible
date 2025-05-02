import React, { useState } from "react";
import { format, eachDayOfInterval } from "date-fns";
import "./App.css";

function App() {
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

    const icmnHora = new Date(icmn).getHours();
    const fcvnHora = new Date(fcvn).getHours();

    const resultadosTemp: any[] = [];
    let total = 0;

    listaDias.forEach((dia) => {
      const horasLuz = fcvnHora - icmnHora;
      const horasOscuridad = 24 - horasLuz;
      const totalDia = 24;

      resultadosTemp.push({
        dia: format(dia, "yyyy-MM-dd"),
        luz: horasLuz,
        oscuridad: horasOscuridad,
        total: totalDia,
      });

      total += totalDia;
    });

    setResultados(resultadosTemp);
    setTotalHoras(total);
  };

  return (
    <div className="App">
      <h2>Cálculo de Tiempo Disponible</h2>

      <div style={{ marginBottom: 20 }}>
        <label>SE VIVE (Inicio): </label>
        <input type="datetime-local" value={seVive} onChange={(e) => setSeVive(e.target.value)} />
        <br />

        <label>HORA MISIÓN (Fin): </label>
        <input type="datetime-local" value={horaMision} onChange={(e) => setHoraMision(e.target.value)} />
        <br />

        <label>ICMN: </label>
        <input type="datetime-local" value={icmn} onChange={(e) => setIcmn(e.target.value)} />
        <br />

        <label>FCVN: </label>
        <input type="datetime-local" value={fcvn} onChange={(e) => setFcvn(e.target.value)} />
        <br />

        <button onClick={calcular}>Calcular</button>
      </div>

      {resultados.length > 0 && (
        <div>
          <table border={1}>
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
                  <td>{r.luz}</td>
                  <td>{r.oscuridad}</td>
                  <td>{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Resumen</h3>
          <p>Total Horas: {totalHoras}</p>
          <p>Planificación (1/3): {(totalHoras / 3).toFixed(2)} horas</p>
          <p>Preparación y Ejecución (2/3): {(2 * totalHoras / 3).toFixed(2)} horas</p>
        </div>
      )}
    </div>
  );
}

export default App;
