import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  crearLibro, altaCuenta, altaConcepto, introducirApunte, anularApunte, modificarApunte,
  regenerar, modificarConcepto, anularCuenta, borrarLibro, interpretarFecha, saldos,
  movimientosCuentas, diario, serieGrafico, mks, cvs, leerApuntes, importarFicherosAmiga,
  desdeJSON, aJSON, totales,
} from "./libro.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function libroBase() {
  let libro = crearLibro();
  libro = altaCuenta(libro, "CAJA", "Caja", 0).libro;
  libro = altaConcepto(libro, 1, "Nomina", "I").libro;
  return libro;
}

test("un ingreso suma en la cuenta y en el mes del concepto", () => {
  let libro = altaCuenta(crearLibro(), "CAJA", "Caja", 1000).libro;
  libro = altaConcepto(libro, 1, "Nomina", "I").libro;
  const hecho = introducirApunte(libro, { fecha: "7-10", descripcion: "Octubre", importe: 1500, cuenta: "CAJA", concepto: 1 });
  libro = hecho.libro;
  assert.equal(hecho.apunte.numero, 1);
  assert.equal(libro.cuentas[0].entradas, 1500);
  assert.equal(libro.cuentas[0].salidas, 0);
  assert.equal(saldos(libro).filas[0].saldo, 2500);
  assert.equal(libro.conceptos[0].meses[9], 1500);
  assert.equal(totales(libro).descuadre, 0);
  assert.equal(saldos(libro).resultado, 1500);
});

test("el gasto va a salidas y el movimiento sin concepto descuadra", () => {
  let libro = altaCuenta(crearLibro(), "BANCO", "Banco", 0).libro;
  libro = altaConcepto(libro, 2, "Comida", "G").libro;
  libro = introducirApunte(libro, { fecha: "01-03", descripcion: "Mercado", importe: 40, cuenta: "BANCO", concepto: 2 }).libro;
  assert.equal(libro.cuentas[0].salidas, 40);
  assert.equal(libro.conceptos[1].meses[2], 40);
  libro = introducirApunte(libro, { fecha: "02-03", descripcion: "Reintegro", importe: -25, cuenta: "BANCO", concepto: 0 }).libro;
  assert.equal(libro.cuentas[0].salidas, 65);
  assert.equal(totales(libro).descuadre, -25);
  const filas = movimientosCuentas(libro, "BANCO", 3)[0].filas;
  assert.equal(filas.length, 2);
  assert.equal(filas[0].salida, 40);
  assert.equal(filas[0].entrada, null);
  assert.equal(filas[1].salida, 25);
  assert.equal(filas[1].saldo, -65);
});

test("un gasto negativo se lista como entrada", () => {
  let libro = altaCuenta(crearLibro(), "CAJA", "Caja", 0).libro;
  libro = altaConcepto(libro, 1, "Comida", "G").libro;
  libro = introducirApunte(libro, { fecha: "15-01", descripcion: "Devolucion", importe: -100, cuenta: "CAJA", concepto: 1 }).libro;
  assert.equal(libro.cuentas[0].salidas, -100);
  const fila = movimientosCuentas(libro, "CAJA", 0)[0].filas[0];
  assert.equal(fila.entrada, 100);
  assert.equal(fila.salida, null);
  assert.equal(fila.saldo, 100);
});

test("anular revierte y no reutiliza el número", () => {
  let libro = libroBase();
  libro = introducirApunte(libro, { fecha: "01-01", descripcion: "A", importe: 80, cuenta: "CAJA", concepto: 1 }).libro;
  libro = anularApunte(libro, 1).libro;
  assert.equal(libro.apuntes.length, 0);
  assert.equal(libro.cuentas[0].entradas, 0);
  assert.equal(libro.conceptos[0].meses[0], 0);
  const segundo = introducirApunte(libro, { fecha: "02-01", descripcion: "B", importe: 10, cuenta: "CAJA", concepto: 1 });
  assert.equal(segundo.apunte.numero, 2);
  assert.equal(segundo.libro.ultimoNumero, 2);
});

test("modificar mueve el importe de cuenta y de mes", () => {
  let libro = altaCuenta(crearLibro(), "CAJA", "Caja", 0).libro;
  libro = altaCuenta(libro, "BANCO", "Banco", 0).libro;
  libro = altaConcepto(libro, 1, "Nomina", "I").libro;
  libro = introducirApunte(libro, { fecha: "01-02", descripcion: "A", importe: 50, cuenta: "CAJA", concepto: 1 }).libro;
  libro = modificarApunte(libro, 1, { fecha: "03-05", descripcion: "B", importe: 70, cuenta: "BANCO", concepto: 1 }).libro;
  assert.equal(libro.cuentas[0].entradas, 0);
  assert.equal(libro.cuentas[1].entradas, 70);
  assert.equal(libro.conceptos[0].meses[1], 0);
  assert.equal(libro.conceptos[0].meses[4], 70);
});

test("regenerar reconstruye los totales y cambiar I/G no lo hace solo", () => {
  let libro = altaCuenta(crearLibro(), "CAJA", "Caja", 500).libro;
  libro = altaConcepto(libro, 1, "Nomina", "I").libro;
  libro = altaConcepto(libro, 2, "Luz", "G").libro;
  libro = introducirApunte(libro, { fecha: "10-04", descripcion: "Sueldo", importe: 200, cuenta: "CAJA", concepto: 1 }).libro;
  libro = introducirApunte(libro, { fecha: "11-04", descripcion: "Recibo", importe: 30, cuenta: "CAJA", concepto: 2 }).libro;
  libro.cuentas[0].entradas = 1;
  libro.cuentas[0].salidas = 1;
  libro.conceptos[0].meses = Array(12).fill(0);
  libro.conceptos[1].meses = Array(12).fill(0);
  const hecho = regenerar(libro);
  libro = hecho.libro;
  assert.equal(hecho.cantidad, 2);
  assert.equal(libro.cuentas[0].saldoInicial, 500);
  assert.equal(libro.cuentas[0].entradas, 200);
  assert.equal(libro.cuentas[0].salidas, 30);
  assert.equal(libro.conceptos[0].meses[3], 200);
  assert.equal(libro.conceptos[1].meses[3], 30);

  libro = modificarConcepto(libro, 1, "Nomina", "G").libro;
  assert.equal(libro.cuentas[0].entradas, 200);
  assert.equal(libro.cuentas[0].salidas, 30);
  libro = regenerar(libro).libro;
  assert.equal(libro.cuentas[0].entradas, 0);
  assert.equal(libro.cuentas[0].salidas, 230);
});

test("no repite la clave y anular una cuenta con apuntes la deja libre", () => {
  let libro = libroBase();
  libro = introducirApunte(libro, { fecha: "01-01", descripcion: "A", importe: 5, cuenta: "CAJA", concepto: 1 }).libro;
  assert.equal(altaCuenta(libro, "CAJA", "Otra", 0).error, "Ya existe");
  libro = anularCuenta(libro, "CAJA").libro;
  assert.equal(libro.cuentas[0].clave, "");
  assert.equal(libro.apuntes.length, 1);
});

test("la fecha y el fichero lleno", () => {
  assert.equal(interpretarFecha("7.10").fecha, "07-10");
  assert.equal(interpretarFecha("31-04").tipo, "invalida");
  assert.equal(interpretarFecha("30-02").tipo, "fecha");
  assert.equal(interpretarFecha("0").tipo, "vacia");
  let libro = libroBase();
  assert.equal(introducirApunte(libro, { fecha: "99-99", descripcion: "A", importe: 1, cuenta: "CAJA", concepto: 1 }).error, "Fecha Incorrecta");
  libro.ultimoNumero = 1500;
  assert.equal(introducirApunte(libro, { fecha: "01-01", descripcion: "A", importe: 1, cuenta: "CAJA", concepto: 1 }).error, "Fichero Completo");
});

test("el diario ordena por mes, día y cuenta, y separa los meses", () => {
  let libro = altaCuenta(crearLibro(), "BANCO", "Banco", 0).libro;
  libro = altaCuenta(libro, "CAJA", "Caja", 0).libro;
  libro = altaConcepto(libro, 1, "Nomina", "I").libro;
  libro = introducirApunte(libro, { fecha: "15-03", descripcion: "Marzo", importe: 1, cuenta: "CAJA", concepto: 1 }).libro;
  libro = introducirApunte(libro, { fecha: "02-01", descripcion: "Enero", importe: 1, cuenta: "BANCO", concepto: 1 }).libro;
  libro = introducirApunte(libro, { fecha: "01-01", descripcion: "Antes", importe: 1, cuenta: "CAJA", concepto: 1 }).libro;
  const informe = diario(libro, 0);
  const fechas = informe.lineas.filter((linea) => !linea.blanco).map((linea) => linea.fecha);
  assert.deepEqual(fechas, ["01-01", "02-01", "15-03"]);
  assert.equal(informe.lineas.some((linea) => linea.blanco), true);
});

test("borrar deja el libro vacío con el nombre nuevo", () => {
  let libro = altaCuenta(crearLibro(), "CAJA", "Caja", 10).libro;
  libro = borrarLibro(libro, "  Nuevo ejercicio  ").libro;
  assert.equal(libro.usuario, "NUEVO EJERCICIO");
  assert.equal(libro.ultimoNumero, 0);
  assert.equal(libro.apuntes.length, 0);
  assert.equal(libro.cuentas.some((c) => c.clave), false);
  assert.equal(borrarLibro(libro, "   ").error, "vacio");
});

test("MKS$/CVS y el registro de APUNTES.REL", () => {
  assert.equal(cvs([0, 0, 0, 0]), 0);
  assert.equal(Math.round(cvs(mks(1))), 1);
  assert.equal(Math.round(cvs(mks(1500))), 1500);
  assert.equal(Math.round(cvs(mks(-40))), -40);
  assert.equal(Math.round(cvs(mks(999999))), 999999);
  const registro = new Uint8Array(63);
  registro.set(Array.from("15-06").map((c) => c.charCodeAt(0)), 0);
  registro.set(Array.from("Mercado").map((c) => c.charCodeAt(0)), 5);
  registro.set(Array.from("CAJA").map((c) => c.charCodeAt(0)), 45);
  registro.set(mks(2), 54);
  registro.set(mks(80), 58);
  const leidos = leerApuntes(registro);
  assert.equal(leidos.length, 1);
  assert.equal(leidos[0].fecha, "15-06");
  assert.equal(leidos[0].descripcion, "MERCADO");
  assert.equal(leidos[0].cuenta, "CAJA");
  assert.equal(leidos[0].concepto, 2);
  assert.equal(leidos[0].importe, 80);
});

test("importa el disco original vacío y un JSON", () => {
  const leido = importarFicherosAmiga({
    parametros: fs.readFileSync(path.join(raiz, "PARAMETROS.SEQ"), "latin1"),
    cuentas: fs.readFileSync(path.join(raiz, "CUENTAS.TAB"), "latin1"),
    conceptos: fs.readFileSync(path.join(raiz, "CONCEPTOS.TAB"), "latin1"),
  });
  assert.equal(leido.error, undefined);
  assert.equal(leido.libro.usuario, "CONTABILIDAD PERSONAL");
  assert.equal(leido.libro.ultimoNumero, 0);
  assert.equal(leido.libro.cuentas.filter((c) => c.clave).length, 0);
  assert.equal(leido.libro.conceptos.filter((c) => c.titulo && c.titulo !== "0").length, 0);
  assert.equal(leido.libro.apuntes.length, 0);
  const otra = desdeJSON(aJSON(leido.libro));
  assert.equal(otra.usuario, "CONTABILIDAD PERSONAL");
  assert.equal(otra.cuentas.length, 15);
  assert.equal(otra.conceptos.length, 30);
});

test("el gráfico acumula la diferencia", () => {
  let libro = altaCuenta(crearLibro(), "CAJA", "Caja", 0).libro;
  libro = altaConcepto(libro, 1, "Nomina", "I").libro;
  libro = altaConcepto(libro, 2, "Luz", "G").libro;
  libro = introducirApunte(libro, { fecha: "01-01", descripcion: "A", importe: 100, cuenta: "CAJA", concepto: 1 }).libro;
  libro = introducirApunte(libro, { fecha: "01-02", descripcion: "B", importe: 30, cuenta: "CAJA", concepto: 2 }).libro;
  const serie = serieGrafico(libro);
  assert.equal(serie.hasta, 2);
  assert.equal(serie.ingresos[0], 100);
  assert.equal(serie.acumulado[0], 100);
  assert.equal(serie.gastos[1], 30);
  assert.equal(serie.acumulado[1], 70);
});
