// Tipos de los archivos de recursos que Metro empaqueta (al importarlos se obtiene su identificador).
declare module "*.wav" {
  const recurso: number;
  export default recurso;
}

declare module "*.png" {
  const recurso: number;
  export default recurso;
}
