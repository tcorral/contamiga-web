export const VERSION = "1.2";
export const FORMATO = 2;
/** 999.999.999,99 €, en céntimos. */
export const MAX_CENTIMOS = 99_999_999_999;
/** Tipo de conversión irrevocable, Reglamento (CE) 2866/98. */
const PESETAS_POR_EURO_MILES = 166386n;
export const MAX_CUENTAS = 15;
export const MAX_CONCEPTOS = 30;
export const MAX_APUNTES = 1500;

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre",
];

export const MESES_CORTOS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"];

const CLAVE_LOCAL = "contamiga.libro.v1";

export function crearLibro(usuario = "CONTABILIDAD PERSONAL") {
  return {
    version: FORMATO,
    usuario: recortar(usuario, 30) || "CONTABILIDAD PERSONAL",
    ultimoNumero: 0,
    cuentas: Array.from({ length: MAX_CUENTAS }, (_, i) => cuentaVacia(i + 1)),
    conceptos: Array.from({ length: MAX_CONCEPTOS }, (_, i) => conceptoVacio(i + 1)),
    apuntes: [],
  };
}

function cuentaVacia(id) {
  return { id, clave: "", titulo: "", saldoInicial: 0, entradas: 0, salidas: 0 };
}

function conceptoVacio(id) {
  return { id, titulo: "", tipo: "", meses: Array(12).fill(0) };
}

export function cuentaActiva(cuenta) {
  return Boolean(cuenta && cuenta.clave && cuenta.clave !== "0");
}

export function conceptoActivo(concepto) {
  return Boolean(concepto && concepto.titulo && concepto.titulo !== "0");
}

export function saldoCuenta(cuenta) {
  return cuenta.saldoInicial + cuenta.entradas - cuenta.salidas;
}

export function mesDe(fecha) {
  if (!fecha || fecha.length < 5) return null;
  const mes = Number(fecha.slice(3, 5));
  return mes >= 1 && mes <= 12 ? mes : null;
}

export function diaDe(fecha) {
  return Number(String(fecha).slice(0, 2)) || 0;
}

export function nombreMes(mes) {
  if (mes >= 1 && mes <= 12) return MESES[mes - 1];
  return "TOTAL";
}

/** Misma regla que InputFecha: día 31 no vale en febrero ni en los meses de 30. */
export function interpretarFecha(texto) {
  const bruto = String(texto ?? "").trim();
  if (bruto === "" || bruto === "0") return { tipo: "vacia" };
  const t = bruto.replace(/[./]/g, "-");
  let dia;
  let mes;
  if (t.includes("-")) {
    const partes = t.split("-");
    if (partes.length !== 2 || partes[0] === "" || partes[1] === "") return { tipo: "invalida" };
    dia = Number(partes[0]);
    mes = Number(partes[1]);
  } else if (/^\d{3,4}$/.test(t)) {
    dia = Number(t.slice(0, t.length - 2));
    mes = Number(t.slice(-2));
  } else {
    return { tipo: "invalida" };
  }
  if (!Number.isInteger(dia) || !Number.isInteger(mes)) return { tipo: "invalida" };
  if (dia > 31 || dia < 1 || mes > 12 || mes < 1) return { tipo: "invalida" };
  if (dia === 31 && (mes === 2 || mes === 4 || mes === 6 || mes === 9 || mes === 11)) {
    return { tipo: "invalida" };
  }
  const fecha = String(dia).padStart(2, "0") + "-" + String(mes).padStart(2, "0");
  return { tipo: "fecha", fecha };
}

export function compararApuntes(a, b) {
  const ma = mesDe(a.fecha) || 0;
  const mb = mesDe(b.fecha) || 0;
  if (ma !== mb) return ma - mb;
  const da = diaDe(a.fecha);
  const db = diaDe(b.fecha);
  if (da !== db) return da - db;
  if (a.cuenta !== b.cuenta) return a.cuenta < b.cuenta ? -1 : 1;
  if (a.concepto !== b.concepto) return a.concepto - b.concepto;
  return a.numero - b.numero;
}

function agrupado(n) {
  const digitos = String(n);
  let salida = "";
  let resto = digitos;
  while (resto.length > 3) {
    salida = "." + resto.slice(-3) + salida;
    resto = resto.slice(0, -3);
  }
  return resto + salida;
}

/** `n` son céntimos: 1250 es 12,50 €. */
export function formatear(n, conSimbolo = true) {
  const negativo = n < 0;
  const absoluto = Math.abs(Math.trunc(n));
  const cifra = agrupado(Math.trunc(absoluto / 100)) + "," + String(absoluto % 100).padStart(2, "0");
  const texto = conSimbolo ? cifra + " €" : cifra;
  return negativo ? "-" + texto : texto;
}

/** Texto para volver a editar un importe, sin símbolo ni separador de miles. */
export function importeEditable(centimos) {
  const negativo = centimos < 0;
  const absoluto = Math.abs(Math.trunc(centimos));
  const texto = Math.trunc(absoluto / 100) + "," + String(absoluto % 100).padStart(2, "0");
  return negativo ? "-" + texto : texto;
}

export function parseEuros(texto, permiteCero = true) {
  let t = String(texto ?? "").trim()
    .replace(/€/g, "")
    .replace(/eur/ig, "")
    .replace(/[\s\u00a0]/g, "");
  if (!t) return null;
  const negativo = t.startsWith("-");
  if (negativo || t.startsWith("+")) t = t.slice(1);
  if (!t) return null;

  let separador = null;
  const comas = t.split(",").length - 1;
  const puntos = t.split(".").length - 1;
  if (comas && puntos) {
    separador = t.lastIndexOf(",") > t.lastIndexOf(".") ? "," : ".";
  } else if (comas) {
    separador = ",";
  } else if (puntos === 1 && t.length - t.lastIndexOf(".") - 1 <= 2) {
    separador = ".";
  }

  let enterosTexto = t;
  let decimalesTexto = "";
  if (separador) {
    const corte = t.lastIndexOf(separador);
    enterosTexto = t.slice(0, corte);
    decimalesTexto = t.slice(corte + 1);
  }
  const enteros = enterosTexto.replace(/[.,]/g, "");
  const parteEntera = enteros === "" ? "0" : enteros;
  if (!/^\d+$/.test(parteEntera) || (decimalesTexto !== "" && !/^\d+$/.test(decimalesTexto))) return null;
  if (decimalesTexto.length > 2) return null;
  const unidades = Number(parteEntera);
  if (!Number.isSafeInteger(unidades) || unidades > Math.floor(MAX_CENTIMOS / 100)) return null;
  const decimales = Number((decimalesTexto + "00").slice(0, 2));
  let centimos = unidades * 100 + decimales;
  if (negativo) centimos = -centimos;
  if (centimos === 0 && !permiteCero) return null;
  if (Math.abs(centimos) > MAX_CENTIMOS) return null;
  return centimos;
}

/** Un campo vacío es cero si se permite. Si no, el texto tiene que ser un importe en euros. */
export function importeCampo(texto, permiteCero = true) {
  const t = String(texto ?? "").trim();
  if (t === "" || t === "-" || t === "+") return permiteCero ? 0 : null;
  return parseEuros(t, permiteCero);
}

export function centimosDesdePesetas(pesetas) {
  const n = Math.trunc(Number(pesetas) || 0);
  if (n === 0) return 0;
  const signo = n < 0 ? -1n : 1n;
  const numerador = BigInt(Math.abs(n)) * 100000n;
  const denominador = PESETAS_POR_EURO_MILES;
  const cociente = numerador / denominador;
  const resto = numerador % denominador;
  const redondeado = resto * 2n >= denominador ? cociente + 1n : cociente;
  return Number(signo * redondeado);
}

export function enteroCampo(texto, ancho, permiteCero = true) {
  const t = String(texto ?? "").trim();
  if (t === "" || t === "-") return permiteCero ? 0 : null;
  if (!/^-?\d+$/.test(t)) return null;
  if (t.replace("-", "").length > ancho) return null;
  const n = Number(t);
  if (!Number.isSafeInteger(n)) return null;
  if (n === 0 && !permiteCero) return null;
  return n;
}

function recortar(texto, max) {
  return String(texto ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function mayus(texto, max) {
  return recortar(texto, max).toLocaleUpperCase("es");
}

export function cuentasActivas(libro) {
  return libro.cuentas.filter(cuentaActiva);
}

export function conceptosActivos(libro) {
  return libro.conceptos.filter(conceptoActivo);
}

export function indiceCuenta(libro, clave) {
  const buscada = mayus(clave, 9);
  return libro.cuentas.findIndex((cuenta) => cuentaActiva(cuenta) && cuenta.clave === buscada);
}

function copiar(libro) {
  return {
    ...libro,
    cuentas: libro.cuentas.map((cuenta) => ({ ...cuenta })),
    conceptos: libro.conceptos.map((concepto) => ({ ...concepto, meses: concepto.meses.slice() })),
    apuntes: libro.apuntes.map((apunte) => ({ ...apunte })),
  };
}

/** ActualizaApunte del BASIC. */
export function aplicar(libro, apunte) {
  const next = copiar(libro);
  const idx = next.cuentas.findIndex((cuenta) => cuentaActiva(cuenta) && cuenta.clave === apunte.cuenta);
  const mes = mesDe(apunte.fecha);
  if (!apunte.concepto) {
    if (idx >= 0) {
      if (apunte.importe < 0) next.cuentas[idx].salidas += -apunte.importe;
      else next.cuentas[idx].entradas += apunte.importe;
    }
    return next;
  }
  const concepto = next.conceptos[apunte.concepto - 1];
  if (concepto && mes) concepto.meses[mes - 1] += apunte.importe;
  if (idx >= 0) {
    if (concepto && concepto.tipo === "G") next.cuentas[idx].salidas += apunte.importe;
    else next.cuentas[idx].entradas += apunte.importe;
  }
  return next;
}

/** La anulación no es el negativo exacto si el concepto ya se dio de baja. */
function revertir(libro, apunte) {
  const next = copiar(libro);
  const idx = next.cuentas.findIndex((cuenta) => cuentaActiva(cuenta) && cuenta.clave === apunte.cuenta);
  const concepto = apunte.concepto ? next.conceptos[apunte.concepto - 1] : null;
  const muerto = !apunte.concepto || !concepto || concepto.titulo === "0";
  if (muerto) {
    if (idx >= 0) {
      if (apunte.importe < 0) next.cuentas[idx].salidas += apunte.importe;
      else next.cuentas[idx].entradas -= apunte.importe;
    }
    return next;
  }
  const mes = mesDe(apunte.fecha);
  if (mes) concepto.meses[mes - 1] -= apunte.importe;
  if (idx >= 0) {
    if (concepto.tipo === "G") next.cuentas[idx].salidas -= apunte.importe;
    else next.cuentas[idx].entradas -= apunte.importe;
  }
  return next;
}

export function altaCuenta(libro, clave, titulo, saldoInicial) {
  const codigo = mayus(clave, 9);
  if (!codigo || codigo === "0") return { error: "vacio" };
  if (codigo.length > 9) return { error: "La clave no puede pasar de 9 caracteres." };
  if (indiceCuenta(libro, codigo) >= 0) return { error: "Ya existe" };
  const hueco = libro.cuentas.findIndex((cuenta) => !cuentaActiva(cuenta));
  if (hueco < 0) return { error: "Fichero lleno" };
  const saldo = Number(saldoInicial) || 0;
  const next = copiar(libro);
  next.cuentas[hueco] = {
    id: hueco + 1,
    clave: codigo,
    titulo: mayus(titulo, 50),
    saldoInicial: saldo,
    entradas: 0,
    salidas: 0,
  };
  return { libro: next };
}

export function modificarCuenta(libro, clave, titulo, saldoInicial) {
  const idx = indiceCuenta(libro, clave);
  if (idx < 0) return { error: "No existe" };
  const next = copiar(libro);
  next.cuentas[idx].titulo = mayus(titulo, 50);
  next.cuentas[idx].saldoInicial = Number(saldoInicial) || 0;
  return { libro: next };
}

export function anularCuenta(libro, clave) {
  const idx = indiceCuenta(libro, clave);
  if (idx < 0) return { error: "No existe" };
  const next = copiar(libro);
  next.cuentas[idx] = cuentaVacia(idx + 1);
  return { libro: next };
}

export function altaConcepto(libro, numero, titulo, tipo) {
  const n = Number(numero);
  if (!n) return { error: "vacio" };
  if (!Number.isInteger(n) || n < 1 || n > MAX_CONCEPTOS) return { error: "Código Incorrecto" };
  if (conceptoActivo(libro.conceptos[n - 1])) return { error: "Ya existe" };
  const marca = mayus(tipo, 1);
  if (marca !== "I" && marca !== "G") return { error: "Introducir 'I' o 'G'" };
  const next = copiar(libro);
  next.conceptos[n - 1] = {
    id: n,
    titulo: mayus(titulo, 18),
    tipo: marca,
    meses: Array(12).fill(0),
  };
  return { libro: next };
}

export function modificarConcepto(libro, numero, titulo, tipo) {
  const n = Number(numero);
  if (!n) return { error: "vacio" };
  if (!Number.isInteger(n) || n < 1 || n > MAX_CONCEPTOS) return { error: "Código Incorrecto" };
  if (!conceptoActivo(libro.conceptos[n - 1])) return { error: "No existe" };
  const marca = mayus(tipo, 1);
  if (marca !== "I" && marca !== "G") return { error: "Introducir 'I' o 'G'" };
  const next = copiar(libro);
  next.conceptos[n - 1].titulo = mayus(titulo, 18);
  next.conceptos[n - 1].tipo = marca;
  return { libro: next };
}

export function anularConcepto(libro, numero) {
  const n = Number(numero);
  if (!n) return { error: "vacio" };
  if (!Number.isInteger(n) || n < 1 || n > MAX_CONCEPTOS) return { error: "Código Incorrecto" };
  if (!conceptoActivo(libro.conceptos[n - 1])) return { error: "No existe" };
  const next = copiar(libro);
  next.conceptos[n - 1] = conceptoVacio(n);
  next.conceptos[n - 1].titulo = "0";
  return { libro: next };
}

function apunteValido(libro, fecha, descripcion, importe, cuenta, concepto) {
  const leida = interpretarFecha(fecha);
  if (leida.tipo !== "fecha") return { error: leida.tipo === "vacia" ? "Debe introducir la fecha" : "Fecha Incorrecta" };
  const cantidad = Number(importe);
  if (!Number.isInteger(cantidad)) return { error: "Importe incorrecto" };
  const codigo = mayus(cuenta, 9);
  if (indiceCuenta(libro, codigo) < 0) return { error: "Cuenta inexistente" };
  const n = Number(concepto) || 0;
  if (n < 0 || n > MAX_CONCEPTOS || !Number.isInteger(n)) return { error: "Número de Concepto incorrecto" };
  if (n !== 0 && !conceptoActivo(libro.conceptos[n - 1])) return { error: "Número de Concepto incorrecto" };
  return {
    fecha: leida.fecha,
    descripcion: mayus(descripcion, 40),
    importe: cantidad,
    cuenta: codigo,
    concepto: n,
  };
}

export function introducirApunte(libro, campos) {
  if (libro.ultimoNumero >= MAX_APUNTES) return { error: "Fichero Completo" };
  const validado = apunteValido(libro, campos.fecha, campos.descripcion, campos.importe, campos.cuenta, campos.concepto);
  if (validado.error) return validado;
  const apunte = { numero: libro.ultimoNumero + 1, ...validado };
  let next = aplicar(libro, apunte);
  next.ultimoNumero = apunte.numero;
  next.apuntes = [...next.apuntes, apunte];
  return { libro: next, apunte };
}

export function apuntesEnFecha(libro, fecha) {
  const leida = interpretarFecha(fecha);
  if (leida.tipo !== "fecha") return { error: leida.tipo === "vacia" ? "vacio" : "Fecha Incorrecta" };
  const lista = libro.apuntes.filter((apunte) => apunte.fecha === leida.fecha).sort(compararApuntes);
  if (!lista.length) return { error: "No hay apuntes" };
  return { fecha: leida.fecha, apuntes: lista };
}

export function modificarApunte(libro, numero, campos) {
  const actual = libro.apuntes.find((apunte) => apunte.numero === numero);
  if (!actual) return { error: "No existe" };
  const validado = apunteValido(libro, campos.fecha, campos.descripcion, campos.importe, campos.cuenta, campos.concepto);
  if (validado.error) return validado;
  const nuevo = { numero, ...validado };
  let next = revertir(libro, actual);
  next = aplicar(next, nuevo);
  next.apuntes = next.apuntes.map((apunte) => (apunte.numero === numero ? nuevo : apunte));
  return { libro: next };
}

export function anularApunte(libro, numero) {
  const actual = libro.apuntes.find((apunte) => apunte.numero === numero);
  if (!actual) return { error: "No existe" };
  const next = revertir(libro, actual);
  next.apuntes = next.apuntes.filter((apunte) => apunte.numero !== numero);
  return { libro: next };
}

export function regenerar(libro) {
  let next = copiar(libro);
  next.cuentas = next.cuentas.map((cuenta) => ({ ...cuenta, entradas: 0, salidas: 0 }));
  next.conceptos = next.conceptos.map((concepto) => ({ ...concepto, meses: Array(12).fill(0) }));
  const ordenados = [...libro.apuntes].sort((a, b) => a.numero - b.numero);
  for (const apunte of ordenados) next = aplicar(next, apunte);
  next.apuntes = ordenados.map((apunte) => ({ ...apunte }));
  return { libro: next, cantidad: ordenados.length };
}

export function borrarLibro(libro, nombre) {
  const titulo = mayus(nombre, 30);
  if (!titulo) return { error: "vacio" };
  return { libro: crearLibro(titulo) };
}

export function cambiarUsuario(libro, nombre) {
  const titulo = mayus(nombre, 30);
  if (!titulo) return { error: "Escribe el nombre de la contabilidad." };
  return { libro: { ...copiar(libro), usuario: titulo } };
}

export function totales(libro) {
  const cuentas = cuentasActivas(libro);
  const inicial = cuentas.reduce((s, c) => s + c.saldoInicial, 0);
  const entradas = cuentas.reduce((s, c) => s + c.entradas, 0);
  const salidas = cuentas.reduce((s, c) => s + c.salidas, 0);
  let ingresos = 0;
  let gastos = 0;
  for (const concepto of libro.conceptos) {
    const suma = concepto.meses.reduce((s, n) => s + n, 0);
    if (concepto.tipo === "I") ingresos += suma;
    else if (concepto.tipo === "G") gastos += suma;
  }
  return {
    inicial,
    entradas,
    salidas,
    saldo: inicial + entradas - salidas,
    resultado: entradas - salidas,
    ingresos,
    gastos,
    descuadre: (entradas - salidas) - (ingresos - gastos),
  };
}

export function saldos(libro) {
  const filas = cuentasActivas(libro).map((cuenta) => ({
    clave: cuenta.clave,
    titulo: cuenta.titulo,
    inicial: cuenta.saldoInicial,
    entradas: cuenta.entradas,
    salidas: cuenta.salidas,
    saldo: saldoCuenta(cuenta),
  }));
  const t = totales(libro);
  return { filas, ...t };
}

function tituloConcepto(libro, numero) {
  if (!numero) return "";
  const concepto = libro.conceptos[numero - 1];
  if (!concepto || concepto.titulo === "0") return concepto?.titulo === "0" ? "0" : "";
  return concepto.titulo;
}

export function movimientosCuentas(libro, clave, mes) {
  const cuales = cuentasActivas(libro).filter((cuenta) => !clave || cuenta.clave === clave);
  return cuales.map((cuenta) => {
    const filas = [];
    let saldo = 0;
    if (mes === 0 && cuenta.saldoInicial) {
      saldo = cuenta.saldoInicial;
      filas.push({
        id: cuenta.clave + "-inicial",
        fecha: "",
        concepto: "",
        descripcion: "SALDO INICIAL",
        entrada: null,
        salida: null,
        saldo,
        inicial: true,
      });
    }
    const movimientos = libro.apuntes
      .filter((apunte) => apunte.cuenta === cuenta.clave && (mes === 0 || mesDe(apunte.fecha) === mes))
      .sort(compararApuntes);
    for (const apunte of movimientos) {
      const tipo = apunte.concepto ? libro.conceptos[apunte.concepto - 1]?.tipo : "";
      let esEntrada = tipo !== "G";
      let importe = apunte.importe;
      if (importe < 0) {
        esEntrada = !esEntrada;
        importe = -importe;
      }
      saldo += esEntrada ? importe : -importe;
      filas.push({
        id: cuenta.clave + "-" + apunte.numero,
        fecha: apunte.fecha,
        concepto: tituloConcepto(libro, apunte.concepto),
        descripcion: apunte.descripcion,
        entrada: esEntrada ? importe : null,
        salida: esEntrada ? null : importe,
        saldo,
        inicial: false,
      });
    }
    return { clave: cuenta.clave, titulo: cuenta.titulo, filas };
  });
}

export function movimientosConceptos(libro, numero, mes) {
  const cuales = conceptosActivos(libro).filter((concepto) => !numero || concepto.id === numero);
  return cuales.map((concepto) => {
    const movimientos = libro.apuntes
      .filter((apunte) => apunte.concepto === concepto.id && (mes === 0 || mesDe(apunte.fecha) === mes))
      .sort(compararApuntes);
    const filas = movimientos.map((apunte) => ({
      id: concepto.id + "-" + apunte.numero,
      fecha: apunte.fecha,
      descripcion: apunte.descripcion,
      cuenta: apunte.cuenta,
      importe: apunte.importe,
    }));
    return {
      numero: concepto.id,
      titulo: concepto.titulo,
      filas,
      total: filas.reduce((s, fila) => s + fila.importe, 0),
    };
  });
}

export function diario(libro, mes) {
  const lineas = [];
  const acumulado = Array(MAX_CONCEPTOS + 1).fill(0);
  const movimientos = libro.apuntes
    .filter((apunte) => apunte.concepto && (mes === 0 || mesDe(apunte.fecha) === mes))
    .sort(compararApuntes);
  let mesAnterior = 0;
  for (const apunte of movimientos) {
    const mesApunte = mesDe(apunte.fecha) || 0;
    if (mes === 0 && mesAnterior !== mesApunte) {
      lineas.push({ id: "sep-" + apunte.numero, blanco: true });
      mesAnterior = mesApunte;
    }
    const tipo = libro.conceptos[apunte.concepto - 1]?.tipo;
    lineas.push({
      id: "d-" + apunte.numero,
      blanco: false,
      fecha: apunte.fecha,
      cuenta: apunte.cuenta,
      concepto: tituloConcepto(libro, apunte.concepto),
      descripcion: apunte.descripcion,
      ingreso: tipo === "G" ? null : apunte.importe,
      gasto: tipo === "G" ? apunte.importe : null,
    });
    acumulado[apunte.concepto] += apunte.importe;
  }
  const ingresos = [];
  const gastos = [];
  for (const concepto of libro.conceptos) {
    if (!acumulado[concepto.id]) continue;
    const fila = { id: concepto.id, titulo: concepto.titulo, importe: acumulado[concepto.id] };
    if (concepto.tipo === "I") ingresos.push(fila);
    else if (concepto.tipo === "G") gastos.push(fila);
  }
  const totalIngresos = ingresos.reduce((s, fila) => s + fila.importe, 0);
  const totalGastos = gastos.reduce((s, fila) => s + fila.importe, 0);
  return { lineas, ingresos, gastos, totalIngresos, totalGastos, diferencia: totalIngresos - totalGastos };
}

export function balanceConceptos(libro, mes) {
  const ingresos = [];
  const gastos = [];
  for (const concepto of conceptosActivos(libro)) {
    const suma = mes === 0 ? concepto.meses.reduce((s, n) => s + n, 0) : concepto.meses[mes - 1];
    const fila = { id: concepto.id, titulo: concepto.titulo, suma };
    if (concepto.tipo === "I") ingresos.push(fila);
    else gastos.push(fila);
  }
  return {
    ingresos,
    gastos,
    totalIngresos: ingresos.reduce((s, fila) => s + fila.suma, 0),
    totalGastos: gastos.reduce((s, fila) => s + fila.suma, 0),
  };
}

export function balanceAnual(libro) {
  const ingresos = [];
  const gastos = [];
  for (const concepto of libro.conceptos) {
    if (concepto.titulo === "0" || concepto.titulo === "") continue;
    const fila = { id: concepto.id, titulo: concepto.titulo, meses: concepto.meses.slice(), total: concepto.meses.reduce((s, n) => s + n, 0) };
    if (concepto.tipo === "I") ingresos.push(fila);
    else if (concepto.tipo === "G") gastos.push(fila);
  }
  const sumar = (filas) => {
    const meses = Array(12).fill(0);
    for (const fila of filas) fila.meses.forEach((n, i) => { meses[i] += n; });
    return meses;
  };
  const sumaIngresos = sumar(ingresos);
  const sumaGastos = sumar(gastos);
  return {
    ingresos,
    gastos,
    sumaIngresos,
    sumaGastos,
    totalIngresos: sumaIngresos.reduce((s, n) => s + n, 0),
    totalGastos: sumaGastos.reduce((s, n) => s + n, 0),
  };
}

export function serieGrafico(libro) {
  const ingresos = Array(12).fill(0);
  const gastos = Array(12).fill(0);
  const diferencia = Array(12).fill(0);
  for (const concepto of libro.conceptos) {
    for (let mes = 0; mes < 12; mes++) {
      const valor = concepto.meses[mes];
      if (concepto.tipo === "I") {
        ingresos[mes] += valor;
        diferencia[mes] += valor;
      } else {
        gastos[mes] += valor;
        diferencia[mes] -= valor;
      }
    }
  }
  for (let mes = 1; mes < 12; mes++) diferencia[mes] += diferencia[mes - 1];
  let hasta = 0;
  for (let mes = 11; mes >= 0; mes--) {
    if (ingresos[mes] || gastos[mes]) {
      hasta = mes + 1;
      break;
    }
  }
  return { ingresos, gastos, acumulado: diferencia, hasta };
}

export function aJSON(libro) {
  return {
    version: FORMATO,
    usuario: libro.usuario,
    ultimoNumero: libro.ultimoNumero,
    cuentas: libro.cuentas,
    conceptos: libro.conceptos,
    apuntes: libro.apuntes,
  };
}

export function desdeJSON(data) {
  if (!data || !Array.isArray(data.cuentas) || !Array.isArray(data.conceptos)) {
    throw new Error("archivo");
  }
  const libro = crearLibro(data.usuario);
  libro.ultimoNumero = Number(data.ultimoNumero) || 0;
  for (let i = 0; i < MAX_CUENTAS; i++) {
    const cuenta = data.cuentas[i];
    if (!cuenta) continue;
    libro.cuentas[i] = {
      id: i + 1,
      clave: mayus(cuenta.clave === "0" ? "" : cuenta.clave, 9),
      titulo: mayus(cuenta.titulo, 50),
      saldoInicial: Number(cuenta.saldoInicial) || 0,
      entradas: Number(cuenta.entradas) || 0,
      salidas: Number(cuenta.salidas) || 0,
    };
  }
  for (let i = 0; i < MAX_CONCEPTOS; i++) {
    const concepto = data.conceptos[i];
    if (!concepto) continue;
    const meses = Array.isArray(concepto.meses) ? concepto.meses.slice(0, 12) : [];
    while (meses.length < 12) meses.push(0);
    const tipo = mayus(concepto.tipo, 1);
    libro.conceptos[i] = {
      id: i + 1,
      titulo: concepto.titulo === "0" ? "0" : mayus(concepto.titulo, 18),
      tipo: tipo === "I" || tipo === "G" ? tipo : "",
      meses: meses.map((n) => Number(n) || 0),
    };
  }
  libro.apuntes = (Array.isArray(data.apuntes) ? data.apuntes : [])
    .map((apunte) => {
      const fecha = interpretarFecha(apunte.fecha);
      if (fecha.tipo !== "fecha") return null;
      return {
        numero: Number(apunte.numero) || 0,
        fecha: fecha.fecha,
        descripcion: mayus(apunte.descripcion, 40),
        cuenta: mayus(apunte.cuenta, 9),
        concepto: Number(apunte.concepto) || 0,
        importe: Number(apunte.importe) || 0,
      };
    })
    .filter(Boolean);
  const maximo = libro.apuntes.reduce((m, apunte) => Math.max(m, apunte.numero), 0);
  if (libro.ultimoNumero < maximo) libro.ultimoNumero = maximo;
  if (!(Number(data.version) >= FORMATO)) escalarACentimos(libro);
  return libro;
}

function escalarACentimos(libro) {
  libro.cuentas = libro.cuentas.map((cuenta) => ({
    ...cuenta,
    saldoInicial: cuenta.saldoInicial * 100,
    entradas: cuenta.entradas * 100,
    salidas: cuenta.salidas * 100,
  }));
  libro.conceptos = libro.conceptos.map((concepto) => ({
    ...concepto,
    meses: concepto.meses.map((n) => n * 100),
  }));
  libro.apuntes = libro.apuntes.map((apunte) => ({ ...apunte, importe: apunte.importe * 100 }));
}

export function cargarLocal() {
  if (typeof localStorage === "undefined") return { libro: crearLibro(), aviso: null };
  try {
    const raw = localStorage.getItem(CLAVE_LOCAL);
    if (!raw) return { libro: crearLibro(), aviso: null };
    return { libro: desdeJSON(JSON.parse(raw)), aviso: null };
  } catch {
    const raw = localStorage.getItem(CLAVE_LOCAL);
    if (raw) localStorage.setItem(CLAVE_LOCAL + ".roto", raw);
    return { libro: crearLibro(), aviso: "No se ha podido leer el libro guardado. Se empieza uno nuevo y la copia anterior queda aparte." };
  }
}

export function guardarLocal(libro) {
  localStorage.setItem(CLAVE_LOCAL, JSON.stringify(aJSON(libro)));
}

export function camposBASIC(texto) {
  const campos = [];
  const chars = Array.from(texto);
  let i = 0;
  while (i < chars.length) {
    const c = chars[i];
    if (c === " " || c === "\n" || c === "\r" || c === "\t" || c === ",") {
      i += 1;
      continue;
    }
    if (c === "\"") {
      i += 1;
      let campo = "";
      while (i < chars.length) {
        if (chars[i] === "\"") {
          i += 1;
          if (chars[i] === "\"") {
            campo += "\"";
            i += 1;
            continue;
          }
          break;
        }
        campo += chars[i];
        i += 1;
      }
      campos.push(campo);
    } else {
      let campo = "";
      while (i < chars.length && chars[i] !== "," && chars[i] !== "\n" && chars[i] !== "\r") {
        campo += chars[i];
        i += 1;
      }
      campos.push(campo.trim());
    }
  }
  return campos;
}

function enteroBASIC(texto) {
  const t = String(texto).trim();
  if (/^-?\d+$/.test(t)) return Number(t);
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function importarFicherosAmiga({ parametros, cuentas, conceptos, apuntes }) {
  if (!parametros || !cuentas || !conceptos) {
    return { error: "Hacen falta PARAMETROS.SEQ, CUENTAS.TAB y CONCEPTOS.TAB." };
  }
  const camposP = camposBASIC(parametros);
  const camposC = camposBASIC(cuentas);
  const camposK = camposBASIC(conceptos);
  if (camposP.length < 2 || camposC.length < MAX_CUENTAS * 5 || camposK.length < MAX_CONCEPTOS * 14) {
    return { error: "Esos ficheros no tienen el formato del disco de ContAmiga." };
  }
  const libro = crearLibro(camposP[0]);
  libro.ultimoNumero = enteroBASIC(camposP[1]);
  for (let i = 0; i < MAX_CUENTAS; i++) {
    const base = i * 5;
    const cruda = camposC[base].trim();
    libro.cuentas[i] = {
      id: i + 1,
      clave: cruda === "0" ? "" : mayus(cruda, 9),
      titulo: mayus(camposC[base + 1], 50),
      saldoInicial: centimosDesdePesetas(enteroBASIC(camposC[base + 2])),
      entradas: centimosDesdePesetas(enteroBASIC(camposC[base + 3])),
      salidas: centimosDesdePesetas(enteroBASIC(camposC[base + 4])),
    };
  }
  for (let i = 0; i < MAX_CONCEPTOS; i++) {
    const base = i * 14;
    const cruda = camposK[base];
    const tipo = mayus(camposK[base + 1], 1);
    libro.conceptos[i] = {
      id: i + 1,
      titulo: cruda === "0" ? "0" : mayus(cruda, 18),
      tipo: tipo === "I" || tipo === "G" ? tipo : "",
      meses: Array.from({ length: 12 }, (_, m) => centimosDesdePesetas(enteroBASIC(camposK[base + 2 + m]))),
    };
  }
  if (apuntes) {
    libro.apuntes = leerApuntes(apuntes).map((apunte) => ({
      ...apunte,
      importe: centimosDesdePesetas(apunte.importe),
    }));
  }
  const maximo = libro.apuntes.reduce((m, apunte) => Math.max(m, apunte.numero), 0);
  if (libro.ultimoNumero < maximo) libro.ultimoNumero = maximo;
  if (libro.apuntes.length) return { libro: regenerar(libro).libro };
  return { libro };
}

export function mks(valor) {
  if (valor === 0) return [0, 0, 0, 0];
  const signo = valor < 0 ? 0x80 : 0;
  let magnitud = Math.abs(valor);
  let exponente = 0;
  while (magnitud >= 1) {
    magnitud /= 2;
    exponente += 1;
  }
  while (magnitud < 0.5) {
    magnitud *= 2;
    exponente -= 1;
  }
  let mantisa = Math.round(magnitud * 16777216);
  if (mantisa >= 0x1000000) {
    mantisa = 0x800000;
    exponente += 1;
  }
  return [
    mantisa & 0xff,
    (mantisa >> 8) & 0xff,
    ((mantisa >> 16) & 0x7f) | signo,
    Math.max(0, Math.min(255, exponente + 128)),
  ];
}

function mbf(exponente, alto, medio, bajo) {
  if (exponente === 0) return 0;
  const signo = (alto & 0x80) === 0 ? 1 : -1;
  const mantisa = (((alto & 0x7f) | 0x80) << 16) | (medio << 8) | bajo;
  return signo * mantisa * 2 ** (exponente - 128 - 24);
}

export function cvs(bytes) {
  if (!bytes || bytes.length !== 4 || bytes.every((b) => b === 0)) return 0;
  const little = mbf(bytes[3], bytes[2], bytes[1], bytes[0]);
  const big = mbf(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (bytes[3] === 0 && bytes[0] !== 0) return big;
  if (bytes[0] === 0 && bytes[3] !== 0) return little;
  const puntuacion = (valor) => {
    if (!Number.isFinite(valor) || Math.abs(valor) >= 1e12) return 1e18;
    return Math.abs(valor - Math.round(valor));
  };
  return puntuacion(little) <= puntuacion(big) ? little : big;
}

export function leerApuntes(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const tamano = 63;
  const cantidad = Math.min(MAX_APUNTES, Math.floor(bytes.length / tamano));
  const apuntes = [];
  for (let i = 0; i < cantidad; i++) {
    const base = i * tamano;
    const fecha = interpretarFecha(latin1(bytes.subarray(base, base + 5)).trim());
    if (fecha.tipo !== "fecha") continue;
    apuntes.push({
      numero: i + 1,
      fecha: fecha.fecha,
      descripcion: mayus(latin1(bytes.subarray(base + 5, base + 45)), 40),
      cuenta: mayus(latin1(bytes.subarray(base + 45, base + 54)), 9),
      concepto: Math.round(cvs(Array.from(bytes.subarray(base + 54, base + 58)))),
      importe: Math.round(cvs(Array.from(bytes.subarray(base + 58, base + 62)))),
    });
  }
  return apuntes;
}

function latin1(bytes) {
  let texto = "";
  for (const b of bytes) texto += String.fromCharCode(b);
  return texto.replace(/\0/g, "");
}
