import { useState } from "react";
import { aJSON, borrarLibro, cambiarUsuario, desdeJSON, importarFicherosAmiga, regenerar } from "./libro.js";
import { useConta } from "./conta.js";
import { Campo, Confirmar, Gadget, Linea, Ventana } from "./ui.jsx";

export function Regenerar() {
  const { libro, setLibro, ir } = useConta();
  const [hecho, setHecho] = useState(null);
  const [confirmar, setConfirmar] = useState(false);

  function ejecutar() {
    const resultado = regenerar(libro);
    setLibro(resultado.libro);
    setHecho(resultado.cantidad);
    setConfirmar(false);
  }

  return (
    <Ventana titulo=" REGENERACION DE FICHEROS " alSalir={() => ir("menu")}>
      <div className="ficha aviso">
        {hecho == null ? (
          <>
            <p className="atencion">¡ Atención !</p>
            <p>Este programa reconstruye todos los ficheros a partir de los datos existentes en el fichero maestro de Apuntes.</p>
            <p>Borra las entradas, las salidas y las sumas mensuales, y las vuelve a calcular. El saldo inicial de cada cuenta se queda como está.</p>
            <p>Dar conformidad para empezar.</p>
            <div className="acciones">
              <Gadget onClick={() => setConfirmar(true)}>CORRECTO</Gadget>
              <Gadget onClick={() => ir("menu")}>CANCELAR</Gadget>
            </div>
            {confirmar && <Confirmar onSi={ejecutar} onNo={() => setConfirmar(false)} />}
          </>
        ) : (
          <>
            <p>Borrado Sumas de Cuentas ... Ok.</p>
            <p>Borrado Sumas de Conceptos ... Ok.</p>
            <p>Borrado Fichero de Claves de Apuntes ... Ok.</p>
            <p>Reactualización de {hecho} apuntes. Ok.</p>
            <div className="acciones">
              <Gadget onClick={() => ir("menu")}>CONTINUAR</Gadget>
            </div>
          </>
        )}
      </div>
    </Ventana>
  );
}

export function Borrar() {
  const { libro, setLibro, ir, alerta } = useConta();
  const [nombre, setNombre] = useState("");
  const [confirmar, setConfirmar] = useState(false);

  function pedir(evento) {
    evento.preventDefault();
    if (!nombre.trim()) {
      ir("menu");
      return;
    }
    setConfirmar(true);
  }

  function ejecutar() {
    const resultado = borrarLibro(libro, nombre);
    if (resultado.error) {
      alerta("Escribe el nombre de la nueva contabilidad, o déjalo en blanco para anular.");
      setConfirmar(false);
      return;
    }
    setLibro(resultado.libro);
    ir("menu");
  }

  return (
    <Ventana titulo=" BORRADO DE FICHEROS " alSalir={() => ir("menu")}>
      <form className="ficha aviso" onSubmit={pedir}>
        <p className="atencion">¡ Atención !</p>
        <p>Este programa borra TODOS los datos de los ficheros.</p>
        <p>Debe usarse únicamente antes de empezar una nueva Contabilidad.</p>
        <p>Si le interesa conservar los datos de esta Contabilidad, exporte una copia desde Preferencias antes de seguir.</p>
        <p>Para anular este proceso, deje en blanco el nombre de la contabilidad.</p>
        <Linea etiqueta="Nombre de la nueva Contabilidad?">
          <Campo valor={nombre} onChange={setNombre} max={30} autoFocus ancho="32ch" />
        </Linea>
        <div className="acciones">
          <Gadget type="submit">CONTINUAR</Gadget>
          <Gadget onClick={() => ir("menu")}>CANCELAR</Gadget>
        </div>
        {confirmar && <Confirmar onSi={ejecutar} onNo={() => setConfirmar(false)} />}
      </form>
    </Ventana>
  );
}

export function Preferencias() {
  const { libro, setLibro, ir, alerta } = useConta();
  const [nombre, setNombre] = useState(libro.usuario);
  const [aviso, setAviso] = useState("");

  function guardarNombre(evento) {
    evento.preventDefault();
    const resultado = cambiarUsuario(libro, nombre);
    if (resultado.error) {
      alerta(resultado.error);
      return;
    }
    setLibro(resultado.libro);
    setAviso("Nombre guardado.");
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(aJSON(libro), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "contamiga.json";
    enlace.click();
    URL.revokeObjectURL(url);
  }

  async function importarJSON(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;
    try {
      setLibro(desdeJSON(JSON.parse(await archivo.text())));
      setAviso("Libro importado.");
      ir("menu");
    } catch {
      alerta("No se ha podido leer el libro.");
    }
  }

  async function importarDisco(evento) {
    const archivos = Array.from(evento.target.files || []);
    evento.target.value = "";
    const porNombre = {};
    for (const archivo of archivos) {
      porNombre[archivo.name.toUpperCase()] = archivo;
    }
    const texto = async (nombreArchivo) => {
      const archivo = porNombre[nombreArchivo];
      if (!archivo) return "";
      const bytes = new Uint8Array(await archivo.arrayBuffer());
      let salida = "";
      for (const byte of bytes) salida += String.fromCharCode(byte);
      return salida;
    };
    const apuntes = porNombre["APUNTES.REL"] ? new Uint8Array(await porNombre["APUNTES.REL"].arrayBuffer()) : null;
    const resultado = importarFicherosAmiga({
      parametros: await texto("PARAMETROS.SEQ"),
      cuentas: await texto("CUENTAS.TAB"),
      conceptos: await texto("CONCEPTOS.TAB"),
      apuntes,
    });
    if (resultado.error) {
      alerta(resultado.error);
      return;
    }
    setLibro(resultado.libro);
    setAviso("Disco Amiga importado.");
    ir("menu");
  }

  return (
    <Ventana titulo=" PREFERENCIAS " alSalir={() => ir("menu")}>
      <form className="ficha" onSubmit={guardarNombre}>
        <p>Este nombre sale en la cabecera y en los listados. En el Amiga se guardaba en PARAMETROS.SEQ.</p>
        <Linea etiqueta="Nombre de la Contabilidad:">
          <Campo valor={nombre} onChange={setNombre} max={30} autoFocus ancho="32ch" />
        </Linea>
        {aviso && <p className="ayuda">{aviso}</p>}
        <div className="acciones">
          <Gadget type="submit">CORRECTO</Gadget>
          <Gadget onClick={exportar}>EXPORTAR LIBRO</Gadget>
          <label className="gadget archivo">
            IMPORTAR LIBRO
            <input type="file" accept="application/json,.json" onChange={importarJSON} />
          </label>
          <label className="gadget archivo">
            IMPORTAR DISCO AMIGA
            <input type="file" multiple onChange={importarDisco} />
          </label>
          <Gadget onClick={() => ir("menu")}>CANCELAR</Gadget>
        </div>
        <p className="ayuda">El disco tiene PARAMETROS.SEQ, CUENTAS.TAB, CONCEPTOS.TAB y, si hay anotaciones, APUNTES.REL. Las pesetas pasan a euros: 1 € = 166,386 PTA. Un libro ya guardado en esta web conserva el mismo valor de cara, ahora en euros.</p>
      </form>
    </Ventana>
  );
}

export function Fin({ onVolver }) {
  return (
    <Ventana titulo="ContAmiga">
      <div className="ficha aviso">
        <p className="atencion">GRABACION DE FICHEROS. Espere un momento, por favor.</p>
        <p>Los ficheros de esta contabilidad quedan grabados en este navegador.</p>
        <div className="acciones">
          <Gadget onClick={onVolver}>CONTINUAR</Gadget>
        </div>
      </div>
    </Ventana>
  );
}
