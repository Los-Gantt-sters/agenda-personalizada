// Zona horaria fija para todas las pruebas (SCRUM-84).
// Las fechas de la agenda son horas locales del colegio. Sin esto, las pruebas dan resultados
// distintos en un portátil en España y en GitHub Actions, que funciona en UTC.
module.exports = async () => {
  process.env.TZ = "Europe/Madrid";
};
