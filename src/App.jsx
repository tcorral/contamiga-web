import { useEffect, useState } from "react";
import { VERSION, cargarLocal, guardarLocal } from "./libro.js";
import { Conta, useConta } from "./conta.js";
import { Gadget, Ventana } from "./ui.jsx";
import {
  AltaConcepto, AltaCuenta, AnuConcepto, AnuCuenta, Entrada, ModApunte, ModConcepto, ModCuenta,
} from "./fichas.jsx";
import {
  BalanceConceptos, BalanceTotal, Grafico, Ingresos, MovConceptos, MovCuentas, Saldos, Sumas,
} from "./informes.jsx";
import { Borrar, Fin, Preferencias, Regenerar } from "./varios.jsx";

const PANTALLAS = {
  altaCuenta: AltaCuenta,
  modCuenta: ModCuenta,
  anuCuenta: AnuCuenta,
  altaConcepto: AltaConcepto,
  modConcepto: ModConcepto,
  anuConcepto: AnuConcepto,
  entrada: Entrada,
  modApunte: ModApunte,
  movCuentas: MovCuentas,
  movConceptos: MovConceptos,
  ingresos: Ingresos,
  balanceTotal: BalanceTotal,
  sumas: Sumas,
  saldos: Saldos,
  balanceConceptos: BalanceConceptos,
  grafico: Grafico,
  regenerar: Regenerar,
  borrar: Borrar,
  preferencias: Preferencias,
};

export function App() {
  const [libro, setLibro] = useState(null);
  const [pantalla, setPantalla] = useState("menu");
  const [alerta, setAlerta] = useState(null);
  const [creditos, setCreditos] = useState(false);
  const [fin, setFin] = useState(false);

  useEffect(() => {
    const cargado = cargarLocal();
    setLibro(cargado.libro);
    if (cargado.aviso) setAlerta(cargado.aviso);
  }, []);

  useEffect(() => {
    if (libro) guardarLocal(libro);
  }, [libro]);

  if (!libro) {
    return <div className="mesa" />;
  }

  const ir = (id) => {
    setCreditos(false);
    setPantalla(id);
  };
  const avisar = (mensaje) => setAlerta(mensaje);
  const Pantalla = PANTALLAS[pantalla] || Menu;

  return (
    <Conta.Provider value={{ libro, setLibro, ir, alerta: avisar, terminar: () => setFin(true) }}>
      <div className="mesa">
        <header className={creditos ? "barra-menu abierto" : "barra-menu"}>
          <button type="button" className="menu-titulo" onClick={() => setCreditos((abierto) => !abierto)}>
            ContAmiga
          </button>
          {creditos && (
            <div className="menu-desplegable">
              <p>ContAmiga  (c) 1987 Commodore, S.A.</p>
              <p>Desarrollada por Commodore, S.A.</p>
              <p>Jordi Sastre</p>
              <p>Setiembre 1987</p>
              <p className="separador" />
              <p>Versión web por Tomas Corral Casas</p>
              <p>2026</p>
              <p>Para los aficionados al Commodore Amiga</p>
              <p><a href={`${import.meta.env.BASE_URL}Manual-ContAmiga.pdf`} target="_blank" rel="noreferrer">Manual de uso</a></p>
            </div>
          )}
        </header>
        {fin ? <Fin onVolver={() => { setFin(false); ir("menu"); }} /> : <Pantalla />}
        {alerta && (
          <div className="alerta" onMouseDown={() => setAlerta(null)}>
            <div className="requester" onMouseDown={(evento) => evento.stopPropagation()}>
              <p className="error">ERROR: {alerta}</p>
              <p>Pulsar un botón del ratón para continuar</p>
              <Gadget onClick={() => setAlerta(null)}>CONTINUAR</Gadget>
            </div>
          </div>
        )}
      </div>
    </Conta.Provider>
  );
}

function Menu() {
  const { libro, ir, terminar } = useConta();
  return (
    <Ventana titulo={"ContAmiga  v" + VERSION + "    " + libro.usuario} azul>
      <div className="menu">
        <section className="caja area-anotaciones">
          <h2>ANOTACIONES</h2>
          <Gadget onClick={() => ir("entrada")}>Introducción</Gadget>
          <Gadget onClick={() => ir("modApunte")}>Modificación</Gadget>
        </section>
        <section className="caja area-cuentas">
          <h2>CUENTAS</h2>
          <Gadget onClick={() => ir("altaCuenta")}>Alta</Gadget>
          <Gadget onClick={() => ir("modCuenta")}>Modificación</Gadget>
          <Gadget onClick={() => ir("anuCuenta")}>Anulación</Gadget>
        </section>
        <section className="caja area-conceptos">
          <h2>CONCEPTOS</h2>
          <Gadget onClick={() => ir("altaConcepto")}>Alta</Gadget>
          <Gadget onClick={() => ir("modConcepto")}>Modificación</Gadget>
          <Gadget onClick={() => ir("anuConcepto")}>Anulación</Gadget>
        </section>
        <section className="caja area-listados">
          <h2>LISTADOS</h2>
          <Gadget onClick={() => ir("movCuentas")}>Movto. de Cuentas</Gadget>
          <Gadget onClick={() => ir("movConceptos")}>Movto. de Conceptos</Gadget>
          <Gadget onClick={() => ir("ingresos")}>Ingresos y Gastos</Gadget>
          <Gadget onClick={() => ir("balanceTotal")}>Balance Total</Gadget>
        </section>
        <section className="caja area-consultas">
          <h2>CONSULTAS</h2>
          <Gadget onClick={() => ir("sumas")}>Sumas de un Concepto</Gadget>
          <Gadget onClick={() => ir("saldos")}>Saldos de Cuentas</Gadget>
          <Gadget onClick={() => ir("balanceConceptos")}>Balance de Conceptos</Gadget>
          <Gadget onClick={() => ir("grafico")}>Gráfico</Gadget>
        </section>
        <div className="area-logo">
          <img src={`${import.meta.env.BASE_URL}rotulo.png`} alt="ContAmiga" />
        </div>
        <section className="caja area-varios">
          <h2>VARIOS</h2>
          <Gadget onClick={() => ir("regenerar")}>Regeneración ficheros</Gadget>
          <Gadget onClick={() => ir("borrar")}>Borrado de ficheros</Gadget>
          <Gadget onClick={() => ir("preferencias")}>Preferencias</Gadget>
        </section>
        <div className="area-fin">
          <Gadget onClick={terminar}>Fin de programa</Gadget>
        </div>
      </div>
    </Ventana>
  );
}
