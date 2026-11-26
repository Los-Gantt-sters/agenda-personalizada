import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { EditorPasos28s } from "../EditorPasos28s";
import { crearRepositorioPasosMemoria } from "../repositorioPasosMemoria";
import type { PasoTarea } from "../../agenda/tipos";

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

const TAREA = "00000000-0000-0000-0000-0000000000e1";
const PASOS: PasoTarea[] = [
  {
    id: "p1",
    orden: 1,
    titulo: "Abre el grifo",
    texto: "Gira el grifo despacio.",
    pictograma_url: "https://picto/1.png",
  },
  { id: "p2", orden: 2, titulo: "Echa jabón", texto: "Pon una gota de jabón." },
  {
    id: "p3",
    orden: 3,
    titulo: "Sécate",
    texto: "Coge la toalla.",
    foto: { ruta: `${TAREA}/foto/a.jpg`, url: "https://x/a.jpg" },
  },
];

async function abrir(pasos: PasoTarea[] = PASOS) {
  const repo = crearRepositorioPasosMemoria({ [TAREA]: pasos });
  const guardar = jest.spyOn(repo, "guardarPasos");
  const onGuardado = jest.fn();
  const alAtras = jest.fn();
  await render(
    <EditorPasos28s
      tareaId={TAREA}
      repo={repo}
      nombreAdulto="Carmen Ruiz"
      alAtras={alAtras}
      onGuardado={onGuardado}
    />,
  );
  await screen.findByTestId("fila-paso-1");
  return { repo, guardar, onGuardado, alAtras };
}

const titulos = (pasos: PasoTarea[]) => pasos.map((p) => p.titulo);

describe("Pantalla 28s: editor de pasos (SCRUM-95: T-10.2)", () => {
  it("carga los pasos en una lista con lo que tiene cada uno", async () => {
    await abrir();
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent(
      "Crear o editar tarea · Pasos y multimedia",
    );
    expect(screen.getByText("Carmen Ruiz")).toBeTruthy();
    expect(screen.getByText("Pasos de la tarea (3)")).toBeTruthy();
    expect(screen.getByTestId("titulo-configurando")).toHaveTextContent(
      "Configurando Paso 1 de 3 · Abre el grifo",
    );
    expect(screen.getByTestId("campo-texto-paso").props.value).toBe("Gira el grifo despacio.");
  });

  it("edita el título y el texto en Lectura Fácil del paso elegido", async () => {
    const { guardar, onGuardado } = await abrir();
    await fireEvent.press(screen.getByTestId("fila-paso-2"));
    await fireEvent.changeText(screen.getByTestId("campo-titulo-paso"), "Echa jabón líquido");
    await fireEvent.changeText(screen.getByTestId("campo-texto-paso"), "Aprieta una vez el bote.");

    await fireEvent.press(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onGuardado).toHaveBeenCalled());
    const enviados = guardar.mock.calls[0][1];
    expect(enviados[1]).toMatchObject({
      id: "p2",
      titulo: "Echa jabón líquido",
      texto: "Aprieta una vez el bote.",
    });
  });

  it("«Subir» y «Bajar» cambian el orden y «Quitar» lo saca de la lista", async () => {
    const { guardar } = await abrir();
    await fireEvent.press(screen.getByTestId("fila-paso-3"));
    await fireEvent.press(screen.getByTestId("btn-28s-subir"));
    expect(screen.getByTestId("titulo-configurando")).toHaveTextContent(
      "Configurando Paso 2 de 3 · Sécate",
    );

    await fireEvent.press(screen.getByTestId("fila-paso-1"));
    await fireEvent.press(screen.getByTestId("btn-28s-quitar"));
    expect(screen.getByText("Pasos de la tarea (2)")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(guardar).toHaveBeenCalled());
    expect(titulos(guardar.mock.calls[0][1])).toEqual(["Sécate", "Echa jabón"]);
    expect(guardar.mock.calls[0][1].map((p) => p.orden)).toEqual([1, 2]);
  });

  it("«Añadir paso» crea uno vacío y no deja guardar sin título", async () => {
    const { guardar } = await abrir();
    await fireEvent.press(screen.getByTestId("btn-28s-anadir"));
    expect(screen.getByTestId("titulo-configurando")).toHaveTextContent(
      /^Configurando Paso 4 de 4/,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByTestId("error-28s")).toHaveTextContent(
      "El paso 4 necesita un título corto.",
    );
    expect(guardar).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId("campo-titulo-paso"), "Cierra el grifo");
    await fireEvent.press(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(guardar).toHaveBeenCalled());
    expect(titulos(guardar.mock.calls[0][1])).toEqual([
      "Abre el grifo",
      "Echa jabón",
      "Sécate",
      "Cierra el grifo",
    ]);
  });

  it("se puede quitar la foto de un paso", async () => {
    const { guardar } = await abrir();
    await fireEvent.press(screen.getByTestId("fila-paso-3"));
    await fireEvent.press(screen.getByTestId("btn-28s-quitar-foto"));
    await fireEvent.press(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(guardar).toHaveBeenCalled());
    expect(guardar.mock.calls[0][1][2].foto).toBeNull();
  });

  it("si no se puede guardar, avisa y no sale de la pantalla", async () => {
    const { repo, onGuardado } = await abrir();
    jest.spyOn(repo, "guardarPasos").mockRejectedValueOnce(new Error("sin red"));
    await fireEvent.press(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByTestId("error-28s")).toHaveTextContent(/^No se ha podido guardar/);
    expect(onGuardado).not.toHaveBeenCalled();
  });

  it("no deja archivos huérfanos: al quitar la foto subida en esta edición o al salir, se borra", async () => {
    const repo = crearRepositorioPasosMemoria({ [TAREA]: PASOS });
    const alAtras = jest.fn();
    await render(
      <EditorPasos28s tareaId={TAREA} repo={repo} alAtras={alAtras} onGuardado={() => {}} />,
    );
    await screen.findByTestId("fila-paso-1");
    // La foto del paso 3 ya estaba guardada: quitarla no la borra hasta «Guardar» (lo hace el servicio).
    await fireEvent.press(screen.getByTestId("fila-paso-3"));
    await fireEvent.press(screen.getByTestId("btn-28s-quitar-foto"));
    expect(repo.borradas).toEqual([]);

    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alAtras).toHaveBeenCalledTimes(1);
    expect(repo.borradas).toEqual([]);
  });

  it("«Atrás» vuelve a los datos de la tarea (28) sin guardar", async () => {
    const { guardar, alAtras } = await abrir();
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alAtras).toHaveBeenCalledTimes(1);
    expect(guardar).not.toHaveBeenCalled();
  });

  it("«Elegir pictograma» abre el buscador (28p) y «Atrás» vuelve al paso", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("btn-28s-elegir-picto"));
    expect(screen.getByTestId("pantalla-28p-selector")).toBeTruthy();
    expect(screen.getByTestId("campo-buscar-picto").props.value).toBe("Abre el grifo");
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(screen.getByTestId("pantalla-28s-editor-pasos")).toBeTruthy();
  });
});
