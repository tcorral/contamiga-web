import { useEffect } from "react";
import { conceptoActivo, cuentasActivas, formatear, importeCampo, MESES } from "./libro.js";
import { useConta } from "./conta.js";

export function Ventana({ titulo, azul, alSalir, children }) {
  useEffect(() => {
    if (!alSalir) return undefined;
    const tecla = (evento) => {
      if (evento.key === "Escape") alSalir();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [alSalir]);

  return (
    <section className="ventana">
      <div className="titulo-ventana">
        <span>{titulo}</span>
        <span className="copia">ContAmiga (c) Commodore, S.A.</span>
      </div>
      <div className={azul ? "contenido azul" : "contenido"}>{children}</div>
    </section>
  );
}

export function Gadget({ children, onClick, on = false, type = "button" }) {
  return (
    <button type={type} className={on ? "gadget on" : "gadget"} onClick={onClick}>
      {children}
    </button>
  );
}

export function Campo({ valor, onChange, max = 40, numerico = false, decimal = false, autoFocus = false, ancho, etiqueta }) {
  return (
    <input
      aria-label={etiqueta}
      value={valor}
      autoFocus={autoFocus}
      maxLength={max}
      spellCheck={false}
      autoCapitalize={numerico ? "off" : "characters"}
      inputMode={numerico || decimal ? "decimal" : "text"}
      style={ancho ? { width: ancho } : undefined}
      onChange={(evento) => {
        let texto = evento.target.value;
        if (decimal) {
          texto = texto.replace(/[^\d.,-]/g, "");
          texto = texto.replace(/(?!^)-/g, "");
        } else if (numerico) {
          texto = texto.replace(/[^\d-]/g, "");
          texto = texto.replace(/(?!^)-/g, "");
        } else {
          texto = texto.toLocaleUpperCase("es");
        }
        onChange(texto.slice(0, max));
      }}
    />
  );
}

export function Linea({ etiqueta, children }) {
  return (
    <label className="linea">
      <span>{etiqueta}</span>
      {children}
    </label>
  );
}

export function Confirmar({ onSi, onNo }) {
  useEffect(() => {
    const tecla = (evento) => {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;
      if (evento.key === "Escape" || evento.key === "n" || evento.key === "N") {
        evento.preventDefault();
        evento.stopPropagation();
        onNo();
      } else if (evento.key === "s" || evento.key === "S" || evento.key === "Enter") {
        evento.preventDefault();
        evento.stopPropagation();
        onSi();
      }
    };
    window.addEventListener("keydown", tecla, true);
    return () => window.removeEventListener("keydown", tecla, true);
  }, [onSi, onNo]);

  return (
    <div className="confirmacion" role="group" aria-label="Confirmación">
      <span>OK? (S/N)</span>
      <button type="button" onClick={onSi}>S</button>
      <button type="button" onClick={onNo}>N</button>
    </div>
  );
}

export function Dinero({ valor }) {
  return <td className="num">{valor == null ? "" : formatear(valor)}</td>;
}

export function ListaCuentas({ onElegir }) {
  const { libro } = useConta();
  const cuentas = cuentasActivas(libro);
  return (
    <aside className="referencia">
      <h3>CUENTAS</h3>
      {cuentas.length === 0 && <p className="vacio">Ninguna</p>}
      {cuentas.map((cuenta) =>
        onElegir ? (
          <button key={cuenta.id} type="button" onClick={() => onElegir(cuenta.clave)}>
            {cuenta.clave}
          </button>
        ) : (
          <p key={cuenta.id}>{cuenta.clave}</p>
        )
      )}
    </aside>
  );
}

export function ListaConceptos({ onElegir }) {
  const { libro } = useConta();
  const numeros = [];
  for (let fila = 1; fila <= 10; fila += 1) numeros.push(fila, fila + 10, fila + 20);
  return (
    <aside className="referencia">
      <h3>CONCEPTOS</h3>
      <div className="columnas-conceptos">
        {numeros.map((numero) => {
          const concepto = libro.conceptos[numero - 1];
          const activo = conceptoActivo(concepto);
          const texto = String(numero).padStart(2, " ") + "  " + (activo ? concepto.titulo : "");
          if (activo && onElegir) {
            return (
              <button key={numero} type="button" onClick={() => onElegir(numero)}>
                {texto}
              </button>
            );
          }
          return <span key={numero}>{texto}</span>;
        })}
      </div>
    </aside>
  );
}

export function FichaCuenta({ cuenta, titulo, setTitulo, saldo, setSaldo, soloLectura }) {
  const inicial = soloLectura ? cuenta.saldoInicial : (importeCampo(saldo, true) ?? 0);
  return (
    <div>
      <Linea etiqueta="CUENTA.........:">
        <strong>{cuenta.clave}</strong>
      </Linea>
      <Linea etiqueta="TITULO.........:">
        {soloLectura ? cuenta.titulo : <Campo valor={titulo} onChange={setTitulo} max={50} autoFocus ancho="32ch" />}
      </Linea>
      <Linea etiqueta="SALDO INICIAL..:">
        {soloLectura ? formatear(cuenta.saldoInicial) : <Campo valor={saldo} onChange={setSaldo} max={16} decimal ancho="16ch" />}
      </Linea>
      <Linea etiqueta="TOTAL ENTRADAS.:">{formatear(cuenta.entradas)}</Linea>
      <Linea etiqueta="TOTAL SALIDAS..:">{formatear(cuenta.salidas)}</Linea>
      <Linea etiqueta="SALDO ACTUAL ..:">{formatear(inicial + cuenta.entradas - cuenta.salidas)}</Linea>
    </div>
  );
}

export function FichaConcepto({ numero, titulo, setTitulo, tipo, setTipo, meses, soloLectura }) {
  const total = (meses || Array(12).fill(0)).reduce((s, n) => s + n, 0);
  return (
    <div>
      <Linea etiqueta="NUMERO CONCEPTO:">
        <strong>{numero}</strong>
      </Linea>
      <Linea etiqueta="TITULO.........:">
        {soloLectura ? titulo : <Campo valor={titulo} onChange={setTitulo} max={18} autoFocus ancho="22ch" />}
      </Linea>
      <Linea etiqueta="I / G .........:">
        {soloLectura ? tipo : <Campo valor={tipo} onChange={setTipo} max={1} ancho="4ch" />}
      </Linea>
      {MESES.map((mes, i) => (
        <Linea key={mes} etiqueta={(mes + " ..............").slice(0, 15) + ":"}>
          {formatear(meses?.[i] || 0)}
        </Linea>
      ))}
      <Linea etiqueta="TOTAL .........:">{formatear(total)}</Linea>
    </div>
  );
}

export function Continuar({ onClick, children = "CONTINUAR" }) {
  return (
    <div className="acciones">
      <Gadget onClick={onClick}>{children}</Gadget>
    </div>
  );
}
