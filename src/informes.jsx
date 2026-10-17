import { useEffect, useState } from "react";
import {
  MESES, MESES_CORTOS, balanceAnual, balanceConceptos, conceptoActivo, cuentasActivas,
  diario, formatear, movimientosConceptos, movimientosCuentas, nombreMes, saldos, serieGrafico,
} from "./libro.js";
import { useConta } from "./conta.js";
import { Continuar, Dinero, FichaConcepto, Gadget, Ventana } from "./ui.jsx";

function Selector({ titulo, cuentas = false, conceptos = false, meses = false, destino = false, onCancelar, onCorrecto }) {
  const { libro } = useConta();
  const [pantalla, setPantalla] = useState(true);
  const [cuenta, setCuenta] = useState(null);
  const [concepto, setConcepto] = useState(0);
  const [mes, setMes] = useState(0);
  const activas = cuentasActivas(libro);
  const lista = libro.conceptos.filter(conceptoActivo);

  return (
    <Ventana titulo={titulo} azul alSalir={onCancelar}>
      <div className="selector">
        {destino && (
          <div>
            <p className="rotulo">Listado por:</p>
            <div className="grupo">
              <Gadget on={pantalla} onClick={() => setPantalla(true)}>PANTALLA</Gadget>
              <Gadget on={!pantalla} onClick={() => setPantalla(false)}>IMPRESORA</Gadget>
            </div>
          </div>
        )}
        {cuentas && (
          <div>
            <p className="rotulo">Elegir Cuenta:</p>
            <div className="grupo">
              <Gadget on={cuenta == null} onClick={() => setCuenta(null)}>TODAS</Gadget>
              {activas.map((item) => (
                <Gadget key={item.id} on={cuenta === item.clave} onClick={() => setCuenta(item.clave)}>
                  {item.clave}
                </Gadget>
              ))}
            </div>
          </div>
        )}
        {conceptos && (
          <div>
            <p className="rotulo">Elegir Concepto:</p>
            <div className="grupo conceptos">
              <Gadget on={concepto === 0} onClick={() => setConcepto(0)}>TODOS</Gadget>
              {lista.map((item) => (
                <Gadget key={item.id} on={concepto === item.id} onClick={() => setConcepto(item.id)}>
                  {item.id} {item.titulo}
                </Gadget>
              ))}
            </div>
          </div>
        )}
        {meses && (
          <div>
            <p className="rotulo">Elegir mes:</p>
            <div className="grupo">
              <Gadget on={mes === 0} onClick={() => setMes(0)}>TOTAL</Gadget>
              {MESES.map((nombre, i) => (
                <Gadget key={nombre} on={mes === i + 1} onClick={() => setMes(i + 1)}>
                  {nombre}
                </Gadget>
              ))}
            </div>
          </div>
        )}
        <div className="acciones">
          <Gadget onClick={() => onCorrecto({ pantalla, cuenta, concepto, mes })}>CORRECTO</Gadget>
          <Gadget onClick={onCancelar}>CANCELAR</Gadget>
        </div>
      </div>
    </Ventana>
  );
}

function Hoja({ titulo, usuario, imprimir, onContinuar, children }) {
  useEffect(() => {
    if (!imprimir) return undefined;
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, [imprimir]);

  return (
    <Ventana titulo={" " + titulo + " "} alSalir={onContinuar}>
      <article className="informe">
        <p className="usuario">{usuario}</p>
        <h2>{titulo}</h2>
        {children}
        <div className="acciones no-print">
          <Gadget onClick={() => window.print()}>IMPRESORA</Gadget>
          <Gadget onClick={onContinuar}>CONTINUAR</Gadget>
        </div>
      </article>
    </Ventana>
  );
}

export function MovCuentas() {
  const { libro, ir } = useConta();
  const [opciones, setOpciones] = useState(null);
  if (!opciones) {
    return (
      <Selector
        titulo=" MOVIMIENTOS DE CUENTAS "
        cuentas
        meses
        destino
        onCancelar={() => ir("menu")}
        onCorrecto={setOpciones}
      />
    );
  }
  const secciones = movimientosCuentas(libro, opciones.cuenta, opciones.mes);
  const titulo = opciones.mes ? "MOVIMIENTOS DE CUENTAS  ·  " + nombreMes(opciones.mes) : "MOVIMIENTOS DE CUENTAS";
  return (
    <Hoja titulo={titulo} usuario={libro.usuario} imprimir={!opciones.pantalla} onContinuar={() => ir("menu")}>
      {secciones.map((seccion) => (
        <section key={seccion.clave}>
          <h3>{seccion.clave} : {seccion.titulo}{opciones.mes ? "  Mes de " + nombreMes(opciones.mes) : ""}</h3>
          <table className="listado">
            <thead>
              <tr>
                <th>Fecha</th><th>Concepto</th><th>Descripción</th><th>Entradas</th><th>Salidas</th><th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {seccion.filas.map((fila) => (
                <tr key={fila.id}>
                  <td>{fila.fecha}</td>
                  <td>{fila.concepto}</td>
                  <td>{fila.descripcion}</td>
                  <Dinero valor={fila.entrada} />
                  <Dinero valor={fila.salida} />
                  <Dinero valor={fila.saldo} />
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {secciones.length === 0 && <p>No hay cuentas.</p>}
    </Hoja>
  );
}

export function MovConceptos() {
  const { libro, ir } = useConta();
  const [opciones, setOpciones] = useState(null);
  if (!opciones) {
    return (
      <Selector
        titulo=" MOVIMIENTOS DE CONCEPTOS "
        conceptos
        meses
        destino
        onCancelar={() => ir("menu")}
        onCorrecto={(elegido) => {
          if (!elegido.concepto && libro.conceptos.every((item) => !conceptoActivo(item))) {
            ir("menu");
            return;
          }
          setOpciones(elegido);
        }}
      />
    );
  }
  const secciones = movimientosConceptos(libro, opciones.concepto || null, opciones.mes);
  const titulo = opciones.mes ? "MOVIMIENTOS DE CONCEPTOS  ·  " + nombreMes(opciones.mes) : "MOVIMIENTOS DE CONCEPTOS";
  return (
    <Hoja titulo={titulo} usuario={libro.usuario} imprimir={!opciones.pantalla} onContinuar={() => ir("menu")}>
      {secciones.map((seccion) => (
        <section key={seccion.numero}>
          <h3>{seccion.titulo}{opciones.mes ? "  Mes de " + nombreMes(opciones.mes) : ""}</h3>
          <table className="listado">
            <thead>
              <tr><th>Fecha</th><th>Descripción</th><th>Cuenta</th><th>Importe</th></tr>
            </thead>
            <tbody>
              {seccion.filas.map((fila) => (
                <tr key={fila.id}>
                  <td>{fila.fecha}</td>
                  <td>{fila.descripcion}</td>
                  <td>{fila.cuenta}</td>
                  <Dinero valor={fila.importe} />
                </tr>
              ))}
              <tr>
                <td colSpan={3}>Total</td>
                <Dinero valor={seccion.total} />
              </tr>
            </tbody>
          </table>
        </section>
      ))}
    </Hoja>
  );
}

export function Ingresos() {
  const { libro, ir } = useConta();
  const [opciones, setOpciones] = useState(null);
  if (!opciones) {
    return (
      <Selector
        titulo=" LISTADO DE INGRESOS Y GASTOS "
        meses
        destino
        onCancelar={() => ir("menu")}
        onCorrecto={setOpciones}
      />
    );
  }
  const informe = diario(libro, opciones.mes);
  const titulo = opciones.mes === 0
    ? "INGRESOS Y GASTOS DE TODO EL AÑO"
    : "INGRESOS Y GASTOS DEL MES DE " + nombreMes(opciones.mes);
  return (
    <Hoja titulo={titulo} usuario={libro.usuario} imprimir={!opciones.pantalla} onContinuar={() => ir("menu")}>
      <table className="listado">
        <thead>
          <tr>
            <th>Fecha</th><th>Cuenta</th><th>Concepto</th><th>Descripción</th><th>Ingresos</th><th>Gastos</th>
          </tr>
        </thead>
        <tbody>
          {informe.lineas.map((linea) => linea.blanco ? (
            <tr key={linea.id}><td colSpan={6}>&nbsp;</td></tr>
          ) : (
            <tr key={linea.id}>
              <td>{linea.fecha}</td>
              <td>{linea.cuenta}</td>
              <td>{linea.concepto}</td>
              <td>{linea.descripcion}</td>
              <Dinero valor={linea.ingreso} />
              <Dinero valor={linea.gasto} />
            </tr>
          ))}
        </tbody>
      </table>
      <h3>TOTALES</h3>
      {informe.ingresos.map((fila) => (
        <p key={"i" + fila.id} className="total">{fila.titulo} {formatear(fila.importe)}</p>
      ))}
      {informe.gastos.map((fila) => (
        <p key={"g" + fila.id} className="total">{fila.titulo} {formatear(fila.importe)}</p>
      ))}
      <p className="total">TOTAL INGRESOS {formatear(informe.totalIngresos)}</p>
      <p className="total">TOTAL GASTOS {formatear(informe.totalGastos)}</p>
      <p className="total">DIFERENCIA {formatear(informe.diferencia)}</p>
    </Hoja>
  );
}

export function BalanceTotal() {
  const { libro, ir } = useConta();
  const [listo, setListo] = useState(false);
  if (!listo) {
    return (
      <Ventana titulo=" BALANCE TOTAL " alSalir={() => ir("menu")}>
        <div className="ficha aviso">
          <p className="atencion">Listado por IMPRESORA</p>
          <p className="atencion">Dar conformidad para empezar</p>
          <div className="acciones">
            <Gadget onClick={() => setListo(true)}>CORRECTO</Gadget>
            <Gadget onClick={() => ir("menu")}>CANCELAR</Gadget>
          </div>
        </div>
      </Ventana>
    );
  }
  const anual = balanceAnual(libro);
  const cuentas = saldos(libro);
  const diferencias = anual.sumaIngresos.map((n, i) => n - anual.sumaGastos[i]);
  return (
    <Hoja titulo="B A L A N C E" usuario={libro.usuario} imprimir onContinuar={() => ir("menu")}>
      <h3>INGRESOS</h3>
      <TablaMeses filas={anual.ingresos} />
      <h3>GASTOS</h3>
      <TablaMeses filas={anual.gastos} />
      <TablaMeses filas={[{ id: "si", titulo: "SUMA INGRESOS", meses: anual.sumaIngresos, total: anual.totalIngresos }]} />
      <TablaMeses filas={[{ id: "sg", titulo: "SUMA GASTOS", meses: anual.sumaGastos, total: anual.totalGastos }]} />
      <TablaMeses filas={[{ id: "df", titulo: "DIFERENCIAS", meses: diferencias, total: anual.totalIngresos - anual.totalGastos }]} />
      <h3>CUENTAS</h3>
      <table className="listado">
        <thead>
          <tr>
            <th>Cuenta</th><th>Título</th><th>S.Inicial</th><th>Entradas</th><th>Salidas</th><th>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {cuentas.filas.map((fila) => (
            <tr key={fila.clave}>
              <td>{fila.clave}</td>
              <td>{fila.titulo}</td>
              <Dinero valor={fila.inicial} />
              <Dinero valor={fila.entradas} />
              <Dinero valor={fila.salidas} />
              <Dinero valor={fila.saldo} />
            </tr>
          ))}
        </tbody>
      </table>
      <h3>RESUMEN</h3>
      <p className="total">CAPITAL INICIAL {formatear(cuentas.inicial)}</p>
      <p className={cuentas.resultado >= 0 ? "total beneficio" : "total perdidas"}>
        {cuentas.resultado >= 0 ? "BENEFICIO" : "PÉRDIDAS"} {formatear(Math.abs(cuentas.resultado))}
      </p>
      <p className="total">CAPITAL ACTUAL {formatear(cuentas.saldo)}</p>
      <p className="total">DESCUADRE {formatear(cuentas.descuadre)}</p>
    </Hoja>
  );
}

function TablaMeses({ filas }) {
  return (
    <div className="tabla-ancha">
      <table className="listado meses">
        <thead>
          <tr>
            <th>Concepto</th>
            {MESES_CORTOS.map((mes) => <th key={mes}>{mes}</th>)}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id}>
              <td>{fila.titulo}</td>
              {fila.meses.map((n, i) => <Dinero key={i} valor={n} />)}
              <Dinero valor={fila.total} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Sumas() {
  const { libro, ir } = useConta();
  const [numero, setNumero] = useState(null);
  if (numero == null) {
    return (
      <Selector
        titulo=" CONSULTA SUMAS DE CONCEPTOS "
        conceptos
        onCancelar={() => ir("menu")}
        onCorrecto={(elegido) => {
          if (!elegido.concepto) ir("menu");
          else setNumero(elegido.concepto);
        }}
      />
    );
  }
  const concepto = libro.conceptos[numero - 1];
  return (
    <Ventana titulo=" CONSULTA SUMAS DE CONCEPTOS " alSalir={() => ir("menu")}>
      <div className="ficha">
        <FichaConcepto numero={numero} titulo={concepto.titulo} tipo={concepto.tipo} meses={concepto.meses} soloLectura />
        <Continuar onClick={() => ir("menu")} />
      </div>
    </Ventana>
  );
}

export function Saldos() {
  const { libro, ir } = useConta();
  const informe = saldos(libro);
  return (
    <Ventana titulo=" SALDOS DE CUENTAS" azul alSalir={() => ir("menu")}>
      <div className="panel">
        <table className="listado">
          <thead>
            <tr>
              <th>Cuenta</th><th>S.Inicial</th><th>Entradas</th><th>Salidas</th><th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {informe.filas.map((fila) => (
              <tr key={fila.clave}>
                <td>{fila.clave}</td>
                <Dinero valor={fila.inicial} />
                <Dinero valor={fila.entradas} />
                <Dinero valor={fila.salidas} />
                <Dinero valor={fila.saldo} />
              </tr>
            ))}
            <tr>
              <td>Totales</td>
              <Dinero valor={informe.inicial} />
              <Dinero valor={informe.entradas} />
              <Dinero valor={informe.salidas} />
              <Dinero valor={informe.saldo} />
            </tr>
          </tbody>
        </table>
        <p className={informe.resultado >= 0 ? "beneficio" : "perdidas"}>
          {informe.resultado >= 0 ? "Beneficio" : "Pérdidas"} {formatear(Math.abs(informe.resultado))}
        </p>
      </div>
      <div className="acciones">
        <Gadget onClick={() => ir("menu")}>CONTINUAR</Gadget>
      </div>
    </Ventana>
  );
}

export function BalanceConceptos() {
  const { libro, ir } = useConta();
  const [mes, setMes] = useState(null);
  if (mes == null) {
    return (
      <Selector
        titulo=" BALANCE DE CONCEPTOS"
        meses
        onCancelar={() => ir("menu")}
        onCorrecto={(elegido) => setMes(elegido.mes)}
      />
    );
  }
  const informe = balanceConceptos(libro, mes);
  const resultado = informe.totalIngresos - informe.totalGastos;
  const encabezado = mes ? "Mes de " + nombreMes(mes) : "SUMAS TOTALES";
  return (
    <Ventana titulo=" BALANCE DE CONCEPTOS" azul alSalir={() => ir("menu")}>
      <div className="dos-paneles">
        <div className="panel">
          <h3>Ingresos</h3>
          {informe.ingresos.map((fila) => (
            <p key={fila.id} className="partida"><span>{formatear(fila.suma)}</span> {fila.titulo}</p>
          ))}
        </div>
        <div className="panel">
          <h3>Gastos</h3>
          {informe.gastos.map((fila) => (
            <p key={fila.id} className="partida"><span>{formatear(fila.suma)}</span> {fila.titulo}</p>
          ))}
        </div>
      </div>
      <div className="panel resumen">
        <h3>{encabezado}</h3>
        <p>Total Ingresos: {formatear(informe.totalIngresos)}</p>
        <p>Total Gastos..: {formatear(informe.totalGastos)}</p>
        <p className={resultado >= 0 ? "beneficio" : "perdidas"}>
          {resultado >= 0 ? "Beneficio.....:" : "Pérdidas......:"} {formatear(Math.abs(resultado))}
        </p>
      </div>
      <div className="acciones">
        <Gadget onClick={() => ir("menu")}>CONTINUAR</Gadget>
      </div>
    </Ventana>
  );
}

export function Grafico() {
  const { libro, ir } = useConta();
  const serie = serieGrafico(libro);
  return (
    <Ventana titulo=" GRAFICO " alSalir={() => ir("menu")}>
      <div className="grafico">
        {serie.hasta === 0 ? <p className="ayuda">No hay datos</p> : <Dibujo serie={serie} />}
        <div className="meses-grafico">
          {MESES_CORTOS.map((mes) => <span key={mes}>{mes}</span>)}
        </div>
        <p className="leyenda">
          <span className="muestra azul">AZUL</span> Ingresos
          <span className="muestra rojo">ROJO</span> Gastos
          <span className="muestra negro">NEGRO</span> Diferencia acumulada
        </p>
        <Continuar onClick={() => ir("menu")} />
      </div>
    </Ventana>
  );
}

function Dibujo({ serie }) {
  const width = 760;
  const height = 320;
  const left = 96;
  const right = 16;
  const top = 16;
  const bottom = 12;
  let max = 0;
  let min = 0;
  for (let i = 0; i < 12; i += 1) {
    for (const valor of [serie.ingresos[i], serie.gastos[i], serie.acumulado[i]]) {
      if (valor > max) max = valor;
      if (valor < min) min = valor;
    }
  }
  if (min > 0) min = 0;
  const span = max + Math.abs(min) || 1;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const x = (i) => left + (plotW * (i + 0.5)) / 12;
  const y = (valor) => top + plotH - ((valor + Math.abs(min)) / span) * plotH;
  const trazo = (valores) => {
    let d = "";
    for (let i = 0; i < serie.hasta; i += 1) {
      d += (i === 0 ? "M" : "L") + x(i) + " " + y(valores[i]) + " ";
    }
    return d;
  };
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Ingresos, gastos y diferencia acumulada">
      <rect x={left} y={top} width={plotW} height={plotH} className="marco-grafico" />
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} x1={left + (plotW * (i + 1)) / 12} x2={left + (plotW * (i + 1)) / 12} y1={top} y2={top + plotH} className="guia" />
      ))}
      <line x1={left} x2={left + plotW} y1={y(0)} y2={y(0)} className="cero" />
      <path d={trazo(serie.ingresos)} className="linea-ingresos" />
      <path d={trazo(serie.gastos)} className="linea-gastos" />
      <path d={trazo(serie.acumulado)} className="linea-acumulado" />
      {Array.from({ length: serie.hasta }, (_, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(serie.ingresos[i])} r="3.5" fill="#0073bf" />
          <circle cx={x(i)} cy={y(serie.gastos[i])} r="3.5" fill="#e64d33" />
          <circle cx={x(i)} cy={y(serie.acumulado[i])} r="3.5" fill="#000" />
        </g>
      ))}
      <text x={4} y={y(max) + 4} className="eje">{formatear(max)}</text>
      <text x={4} y={y(min)} className="eje">{formatear(min)}</text>
    </svg>
  );
}
