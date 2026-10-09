import { useEffect, useState } from "react";
import {
  MAX_APUNTES, altaConcepto, altaCuenta, anularApunte, anularConcepto, anularCuenta,
  apuntesEnFecha, conceptoActivo, cuentasActivas, enteroCampo, formatear, indiceCuenta,
  introducirApunte, modificarApunte, modificarConcepto, modificarCuenta,
} from "./libro.js";
import { useConta } from "./conta.js";
import {
  Campo, Confirmar, FichaConcepto, FichaCuenta, Gadget, Linea, ListaConceptos, ListaCuentas, Ventana,
} from "./ui.jsx";

function aplicar(resultado, setLibro, alerta) {
  if (resultado.error) {
    if (resultado.error !== "vacio") alerta(resultado.error);
    return false;
  }
  setLibro(resultado.libro);
  return true;
}

export function AltaCuenta() {
  const { libro, setLibro, ir, alerta } = useConta();
  const [clave, setClave] = useState("");
  const [elegida, setElegida] = useState("");
  const [titulo, setTitulo] = useState("");
  const [saldo, setSaldo] = useState("0");
  const [confirmar, setConfirmar] = useState(false);

  function pedir(evento) {
    evento.preventDefault();
    const codigo = clave.trim();
    if (!codigo || codigo === "0") {
      ir("menu");
      return;
    }
    if (indiceCuenta(libro, codigo) >= 0) {
      alerta("Ya existe");
      return;
    }
    if (!libro.cuentas.some((cuenta) => !cuenta.clave || cuenta.clave === "0")) {
      alerta("Fichero lleno");
      return;
    }
    setElegida(codigo.toLocaleUpperCase("es"));
    setTitulo("");
    setSaldo("0");
    setConfirmar(false);
  }

  function guardar() {
    const saldoInicial = enteroCampo(saldo, 7, true);
    if (saldoInicial == null) {
      alerta("Saldo inicial incorrecto");
      setConfirmar(false);
      return;
    }
    if (!aplicar(altaCuenta(libro, elegida, titulo, saldoInicial), setLibro, alerta)) return;
    setElegida("");
    setClave("");
    setConfirmar(false);
  }

  return (
    <Ventana titulo=" DEFINICION DE NUEVAS CUENTAS " alSalir={() => ir("menu")}>
      <div className="dos">
        <form className="ficha" onSubmit={elegida ? (evento) => { evento.preventDefault(); setConfirmar(true); } : pedir}>
          {!elegida ? (
            <Linea etiqueta="CUENTA.........:">
              <Campo valor={clave} onChange={setClave} max={9} autoFocus ancho="14ch" />
            </Linea>
          ) : (
            <FichaCuenta
              cuenta={{ clave: elegida, titulo, saldoInicial: Number(saldo) || 0, entradas: 0, salidas: 0 }}
              titulo={titulo}
              setTitulo={setTitulo}
              saldo={saldo}
              setSaldo={setSaldo}
            />
          )}
          <p className="ayuda">En blanco vuelve al menú. Quedan {15 - cuentasActivas(libro).length} cuentas libres.</p>
          <div className="acciones">
            <Gadget type="submit">{elegida ? "CORRECTO" : "CONTINUAR"}</Gadget>
            <Gadget onClick={() => ir("menu")}>CANCELAR</Gadget>
          </div>
          {confirmar && <Confirmar onSi={guardar} onNo={() => setConfirmar(false)} />}
        </form>
        <ListaCuentas />
      </div>
    </Ventana>
  );
}

export function ModCuenta() {
  const { libro, setLibro, ir, alerta } = useConta();
  const [clave, setClave] = useState("");
  const [cuenta, setCuenta] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [saldo, setSaldo] = useState("");
  const [confirmar, setConfirmar] = useState(false);

  function pedir(evento) {
    evento.preventDefault();
    if (!clave.trim() || clave.trim() === "0") {
      ir("menu");
      return;
    }
    const idx = indiceCuenta(libro, clave);
    if (idx < 0) {
      alerta("No existe");
      return;
    }
    const encontrada = libro.cuentas[idx];
    setCuenta(encontrada);
    setTitulo(encontrada.titulo);
    setSaldo(String(encontrada.saldoInicial));
    setConfirmar(false);
  }

  function guardar() {
    const saldoInicial = enteroCampo(saldo, 7, true);
    if (saldoInicial == null) {
      alerta("Saldo inicial incorrecto");
      setConfirmar(false);
      return;
    }
    if (!aplicar(modificarCuenta(libro, cuenta.clave, titulo, saldoInicial), setLibro, alerta)) return;
    setCuenta(null);
    setClave("");
    setConfirmar(false);
  }

  const vista = cuenta && libro.cuentas.find((item) => item.clave === cuenta.clave);

  return (
    <Ventana titulo=" MODIFICACION DE CUENTAS " alSalir={() => ir("menu")}>
      <div className="dos">
        <form className="ficha" onSubmit={cuenta ? (evento) => { evento.preventDefault(); setConfirmar(true); } : pedir}>
          {!vista ? (
            <Linea etiqueta="CUENTA.........:">
              <Campo valor={clave} onChange={setClave} max={9} autoFocus ancho="14ch" />
            </Linea>
          ) : (
            <FichaCuenta cuenta={vista} titulo={titulo} setTitulo={setTitulo} saldo={saldo} setSaldo={setSaldo} />
          )}
          <p className="ayuda">En blanco vuelve al menú.</p>
          <div className="acciones">
            <Gadget type="submit">{cuenta ? "CORRECTO" : "CONTINUAR"}</Gadget>
            <Gadget onClick={() => ir("menu")}>CANCELAR</Gadget>
          </div>
          {confirmar && <Confirmar onSi={guardar} onNo={() => setConfirmar(false)} />}
        </form>
        <ListaCuentas onElegir={(codigo) => { setClave(codigo); }} />
      </div>
    </Ventana>
  );
}

export function AnuCuenta() {
  const { libro, setLibro, ir, alerta } = useConta();
  const [clave, setClave] = useState("");
  const [cuenta, setCuenta] = useState(null);
  const [confirmar, setConfirmar] = useState(false);

  function pedir(evento) {
    evento.preventDefault();
    if (!clave.trim() || clave.trim() === "0") {
      ir("menu");
      return;
    }
    const idx = indiceCuenta(libro, clave);
    if (idx < 0) {
      alerta("No existe");
      return;
    }
    setCuenta(libro.cuentas[idx]);
    setConfirmar(true);
  }

  function guardar() {
    if (!aplicar(anularCuenta(libro, cuenta.clave), setLibro, alerta)) return;
    setCuenta(null);
    setClave("");
    setConfirmar(false);
  }

  return (
    <Ventana titulo=" ANULACION DE CUENTAS " alSalir={() => ir("menu")}>
      <div className="dos">
        <form className="ficha" onSubmit={pedir}>
          {!cuenta ? (
            <Linea etiqueta="CUENTA.........:">
              <Campo valor={clave} onChange={setClave} max={9} autoFocus ancho="14ch" />
            </Linea>
          ) : (
            <FichaCuenta cuenta={cuenta} soloLectura />
          )}
          <p className="ayuda">En blanco vuelve al menú.</p>
          <div className="acciones">
            {!cuenta && <Gadget type="submit">CONTINUAR</Gadget>}
            <Gadget onClick={() => ir("menu")}>CANCELAR</Gadget>
          </div>
          {confirmar && <Confirmar onSi={guardar} onNo={() => { setConfirmar(false); setCuenta(null); }} />}
        </form>
        <ListaCuentas onElegir={setClave} />
      </div>
    </Ventana>
  );
}

function pedirNumero(libro, texto, alta) {
  const n = Number(String(texto).trim());
  if (!texto.trim() || n === 0) return { error: "vacio" };
  if (!Number.isInteger(n) || n < 1 || n > 30) return { error: "Código Incorrecto" };
  const activo = conceptoActivo(libro.conceptos[n - 1]);
  if (alta && activo) return { error: "Ya existe" };
  if (!alta && !activo) return { error: "No existe" };
  return { numero: n };
}

export function AltaConcepto() {
  return <ConceptoForm titulo=" DEFINICION DE NUEVOS CONCEPTOS " alta />;
}

export function ModConcepto() {
  return <ConceptoForm titulo=" MODIFICACION DE CONCEPTOS " />;
}

export function AnuConcepto() {
  return <ConceptoForm titulo=" ANULACION DE CONCEPTOS " anular />;
}

function ConceptoForm({ titulo, alta = false, anular = false }) {
  const { libro, setLibro, ir, alerta } = useConta();
  const [numeroTexto, setNumeroTexto] = useState("");
  const [numero, setNumero] = useState(0);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [confirmar, setConfirmar] = useState(false);

  function pedir(evento) {
    evento.preventDefault();
    const leido = pedirNumero(libro, numeroTexto, alta);
    if (leido.error === "vacio") {
      ir("menu");
      return;
    }
    if (leido.error) {
      alerta(leido.error);
      return;
    }
    const actual = libro.conceptos[leido.numero - 1];
    setNumero(leido.numero);
    setNombre(alta ? "" : actual.titulo);
    setTipo(alta ? "" : actual.tipo);
    setConfirmar(anular);
  }

  function guardar() {
    let resultado;
    if (anular) resultado = anularConcepto(libro, numero);
    else if (alta) resultado = altaConcepto(libro, numero, nombre, tipo);
    else resultado = modificarConcepto(libro, numero, nombre, tipo);
    if (!aplicar(resultado, setLibro, alerta)) {
      setConfirmar(false);
      return;
    }
    setNumero(0);
    setNumeroTexto("");
    setConfirmar(false);
  }

  const actual = numero ? libro.conceptos[numero - 1] : null;

  return (
    <Ventana titulo={titulo} alSalir={() => ir("menu")}>
      <div className="dos">
        <form className="ficha" onSubmit={numero && !anular ? (evento) => { evento.preventDefault(); setConfirmar(true); } : pedir}>
          {!numero ? (
            <Linea etiqueta="NUMERO CONCEPTO:">
              <Campo valor={numeroTexto} onChange={setNumeroTexto} max={2} numerico autoFocus ancho="6ch" />
            </Linea>
          ) : (
            <FichaConcepto
              numero={numero}
              titulo={anular ? actual.titulo : nombre}
              setTitulo={setNombre}
              tipo={anular ? actual.tipo : tipo}
              setTipo={setTipo}
              meses={actual.meses}
              soloLectura={anular}
            />
          )}
          {!numero && <p className="ayuda">0 vuelve al menú. El número va de 1 a 30. I es ingreso y G es gasto.</p>}
          {numero && !alta && !anular && (
            <p className="ayuda">Si cambia I por G, Regeneración de ficheros vuelve a sumar las anotaciones.</p>
          )}
          <div className="acciones">
            {!confirmar && <Gadget type="submit">{numero && !anular ? "CORRECTO" : "CONTINUAR"}</Gadget>}
            <Gadget onClick={() => ir("menu")}>CANCELAR</Gadget>
          </div>
          {confirmar && <Confirmar onSi={guardar} onNo={() => { setConfirmar(false); if (anular) setNumero(0); }} />}
        </form>
        <ListaConceptos onElegir={(n) => setNumeroTexto(String(n))} />
      </div>
    </Ventana>
  );
}

export function Entrada() {
  const { libro, setLibro, ir, alerta } = useConta();
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [importe, setImporte] = useState("");
  const [cuenta, setCuenta] = useState("");
  const [concepto, setConcepto] = useState("");
  const [prev, setPrev] = useState({ fecha: "", descripcion: "", importe: "", cuenta: "", concepto: "" });
  const [hechas, setHechas] = useState([]);
  const [confirmar, setConfirmar] = useState(false);
  const [borrador, setBorrador] = useState(null);

  useEffect(() => {
    if (libro.ultimoNumero >= MAX_APUNTES) {
      alerta("Fichero Completo");
      ir("menu");
    }
    // Solo al entrar: si el fichero ya está lleno no hay nada que anotar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resolver() {
    if (fecha.trim() === "0") return { salir: true };
    const fechaEff = fecha.trim() || prev.fecha;
    const descEff = descripcion.trim() ? descripcion : prev.descripcion;
    let impEff;
    if (importe.trim() === "" || importe.trim() === "0") impEff = prev.importe !== "" ? prev.importe : importe.trim();
    else impEff = importe.trim();
    const cuentaEff = cuenta.trim() || prev.cuenta;
    const concEff = concepto.trim() === "" ? prev.concepto : concepto.trim();
    if (!fechaEff) return { error: "Fecha Incorrecta" };
    if (impEff === "" || impEff == null) return { error: "Importe incorrecto" };
    const cantidad = enteroCampo(String(impEff), 8, true);
    if (cantidad == null) return { error: "Importe incorrecto" };
    return {
      fecha: fechaEff,
      descripcion: descEff,
      importe: cantidad,
      cuenta: cuentaEff,
      concepto: concEff === "" ? 0 : Number(concEff),
    };
  }

  function pedir(evento) {
    evento.preventDefault();
    const campos = resolver();
    if (campos.salir) {
      ir("menu");
      return;
    }
    if (campos.error) {
      alerta(campos.error);
      return;
    }
    const ensayo = introducirApunte(structuredClone(libro), campos);
    if (ensayo.error) {
      alerta(ensayo.error);
      return;
    }
    setBorrador(campos);
    setConfirmar(true);
  }

  function guardar() {
    const hecho = introducirApunte(libro, borrador);
    if (!aplicar(hecho, setLibro, alerta)) {
      setConfirmar(false);
      return;
    }
    setHechas((lista) => [...lista, hecho.apunte]);
    setPrev({
      fecha: hecho.apunte.fecha,
      descripcion: hecho.apunte.descripcion,
      importe: String(hecho.apunte.importe),
      cuenta: hecho.apunte.cuenta,
      concepto: String(hecho.apunte.concepto),
    });
    setFecha("");
    setDescripcion("");
    setImporte("");
    setCuenta("");
    setConcepto("");
    setBorrador(null);
    setConfirmar(false);
  }

  return (
    <Ventana titulo=" ENTRADA DE ANOTACIONES " alSalir={() => ir("menu")}>
      <form className="ficha" onSubmit={pedir}>
        <p className="cabecera-apuntes">Fecha&nbsp;&nbsp;Descripción&nbsp;&nbsp;Importe&nbsp;&nbsp;Cuenta&nbsp;&nbsp;Concepto</p>
        {hechas.map((apunte) => (
          <p key={apunte.numero} className={claseConcepto(libro, apunte.concepto)}>
            {apunte.fecha}  {apunte.descripcion.padEnd(20, " ").slice(0, 20)}  {formatear(apunte.importe).padStart(10, " ")}  {apunte.cuenta.padEnd(9, " ")}  {String(apunte.concepto).padStart(2, " ")}  {rotulo(libro, apunte.concepto)}
          </p>
        ))}
        <div className="fila-apunte">
          <Campo etiqueta="Fecha" valor={fecha} onChange={setFecha} max={5} autoFocus ancho="8ch" />
          <Campo etiqueta="Descripción" valor={descripcion} onChange={setDescripcion} max={40} ancho="32ch" />
          <Campo etiqueta="Importe" valor={importe} onChange={setImporte} max={8} numerico ancho="12ch" />
          <Campo etiqueta="Cuenta" valor={cuenta} onChange={setCuenta} max={9} ancho="12ch" />
          <Campo etiqueta="Concepto" valor={concepto} onChange={setConcepto} max={2} numerico ancho="6ch" />
        </div>
        <p className="ayuda">Fecha 0 vuelve al menú. Un campo en blanco repite el anterior. Concepto 0 es un movimiento sin concepto. Apunte {libro.ultimoNumero} de {MAX_APUNTES}.</p>
        <div className="acciones">
          <Gadget type="submit">CONTINUAR</Gadget>
          <Gadget onClick={() => ir("menu")}>CANCELAR</Gadget>
        </div>
        {confirmar && <Confirmar onSi={guardar} onNo={() => setConfirmar(false)} />}
      </form>
      <div className="dos compacta">
        <ListaCuentas onElegir={setCuenta} />
        <ListaConceptos onElegir={(n) => setConcepto(String(n))} />
      </div>
    </Ventana>
  );
}

function rotulo(libro, numero) {
  if (!numero) return "";
  const concepto = libro.conceptos[numero - 1];
  return conceptoActivo(concepto) ? concepto.titulo.slice(0, 14) : "";
}

function claseConcepto(libro, numero) {
  if (!numero) return "apunte";
  return libro.conceptos[numero - 1]?.tipo === "G" ? "apunte gasto" : "apunte ingreso";
}

export function ModApunte() {
  const { libro, setLibro, ir, alerta } = useConta();
  const [paso, setPaso] = useState("fecha");
  const [fecha, setFecha] = useState("");
  const [lista, setLista] = useState([]);
  const [numero, setNumero] = useState("");
  const [actual, setActual] = useState(null);
  const [campos, setCampos] = useState(null);
  const [orden, setOrden] = useState("");
  const [confirmar, setConfirmar] = useState(false);

  function pedirFecha(evento) {
    evento.preventDefault();
    const hecho = apuntesEnFecha(libro, fecha);
    if (hecho.error === "vacio") {
      ir("menu");
      return;
    }
    if (hecho.error) {
      alerta(hecho.error);
      return;
    }
    setLista(hecho.apuntes);
    if (hecho.apuntes.length === 1) abrir(hecho.apuntes[0]);
    else setPaso("numero");
  }

  function abrir(apunte) {
    setActual(apunte);
    setCampos({
      fecha: apunte.fecha,
      descripcion: apunte.descripcion,
      importe: String(apunte.importe),
      cuenta: apunte.cuenta,
      concepto: String(apunte.concepto),
    });
    setPaso("ficha");
    setOrden("");
    setConfirmar(false);
  }

  function pedirNumero(evento) {
    evento.preventDefault();
    const n = Number(numero);
    if (!n) {
      setPaso("fecha");
      setNumero("");
      return;
    }
    const apunte = lista.find((item) => item.numero === n);
    if (!apunte) {
      alerta("No existe");
      return;
    }
    abrir(apunte);
  }

  function ordenar(evento) {
    evento.preventDefault();
    const letra = orden.trim().toUpperCase();
    if (letra === "R" || letra === "") {
      setPaso("fecha");
      setActual(null);
      return;
    }
    if (letra === "A") {
      if (!aplicar(anularApunte(libro, actual.numero), setLibro, alerta)) return;
      setPaso("fecha");
      setActual(null);
      setFecha("");
      return;
    }
    if (letra !== "M") return;
    setPaso("editar");
  }

  function preparar(evento) {
    evento.preventDefault();
    const cantidad = enteroCampo(campos.importe, 8, true);
    if (cantidad == null) {
      alerta("Importe incorrecto");
      return;
    }
    const ensayo = modificarApunte(structuredClone(libro), actual.numero, { ...campos, importe: cantidad });
    if (ensayo.error) {
      alerta(ensayo.error);
      return;
    }
    setConfirmar(true);
  }

  function guardar() {
    const cantidad = enteroCampo(campos.importe, 8, true);
    if (!aplicar(modificarApunte(libro, actual.numero, { ...campos, importe: cantidad }), setLibro, alerta)) {
      setConfirmar(false);
      return;
    }
    setPaso("fecha");
    setActual(null);
    setFecha("");
    setConfirmar(false);
  }

  return (
    <Ventana titulo=" MODIFICACION DE ANOTACIONES " alSalir={() => ir("menu")}>
      <div className="ficha">
        {paso === "fecha" && (
          <form onSubmit={pedirFecha}>
            <Linea etiqueta="Fecha del Apunte:">
              <Campo valor={fecha} onChange={setFecha} max={5} autoFocus ancho="8ch" />
            </Linea>
            <p className="ayuda">0 vuelve al menú.</p>
            <div className="acciones">
              <Gadget type="submit">CONTINUAR</Gadget>
              <Gadget onClick={() => ir("menu")}>CANCELAR</Gadget>
            </div>
          </form>
        )}
        {paso === "numero" && (
          <form onSubmit={pedirNumero}>
            {lista.map((apunte) => (
              <p key={apunte.numero} className="apunte">
                {String(apunte.numero).padStart(4, " ")}  {apunte.fecha}  {apunte.descripcion}  {formatear(apunte.importe)}  {apunte.cuenta}  {apunte.concepto}
              </p>
            ))}
            <Linea etiqueta="Número de Apunte:">
              <Campo valor={numero} onChange={setNumero} max={4} numerico autoFocus ancho="8ch" />
            </Linea>
            <p className="ayuda">0 vuelve a pedir la fecha.</p>
            <Gadget type="submit">CONTINUAR</Gadget>
          </form>
        )}
        {paso === "ficha" && actual && (
          <form onSubmit={ordenar}>
            <Linea etiqueta="Fecha......:">{actual.fecha}</Linea>
            <Linea etiqueta="Descripción:">{actual.descripcion}</Linea>
            <Linea etiqueta="Importe....:">{formatear(actual.importe)}</Linea>
            <Linea etiqueta="Cuenta.....:">{actual.cuenta}</Linea>
            <Linea etiqueta="Concepto...:">{actual.concepto} {rotulo(libro, actual.concepto)}</Linea>
            <Linea etiqueta="Modificar = M   Anular = A   Retroceder = R">
              <Campo valor={orden} onChange={setOrden} max={1} autoFocus ancho="4ch" />
            </Linea>
            <Gadget type="submit">CONTINUAR</Gadget>
          </form>
        )}
        {paso === "editar" && campos && (
          <form onSubmit={preparar}>
            <Linea etiqueta="Fecha......:">
              <Campo valor={campos.fecha} onChange={(valor) => setCampos({ ...campos, fecha: valor })} max={5} autoFocus ancho="8ch" />
            </Linea>
            <Linea etiqueta="Descripción:">
              <Campo valor={campos.descripcion} onChange={(valor) => setCampos({ ...campos, descripcion: valor })} max={40} ancho="36ch" />
            </Linea>
            <Linea etiqueta="Importe....:">
              <Campo valor={campos.importe} onChange={(valor) => setCampos({ ...campos, importe: valor })} max={8} numerico ancho="12ch" />
            </Linea>
            <Linea etiqueta="Cuenta.....:">
              <Campo valor={campos.cuenta} onChange={(valor) => setCampos({ ...campos, cuenta: valor })} max={9} ancho="14ch" />
            </Linea>
            <Linea etiqueta="Concepto...:">
              <Campo valor={campos.concepto} onChange={(valor) => setCampos({ ...campos, concepto: valor })} max={2} numerico ancho="6ch" />
            </Linea>
            <div className="acciones">
              <Gadget type="submit">CONTINUAR</Gadget>
              <Gadget onClick={() => setPaso("ficha")}>CANCELAR</Gadget>
            </div>
            {confirmar && <Confirmar onSi={guardar} onNo={() => setConfirmar(false)} />}
          </form>
        )}
      </div>
      {paso === "editar" && (
        <div className="dos compacta">
          <ListaCuentas onElegir={(codigo) => campos && setCampos({ ...campos, cuenta: codigo })} />
          <ListaConceptos onElegir={(n) => campos && setCampos({ ...campos, concepto: String(n) })} />
        </div>
      )}
    </Ventana>
  );
}
