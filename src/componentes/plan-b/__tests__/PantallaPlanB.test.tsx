import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ERROR_GUARDAR_PLAN_B, PantallaPlanB } from "../PantallaPlanB";
import { crearRepositorioPlanBDemo } from "../repositorioPlanBDemo";
import type { RepositorioPlanB } from "../../../tipos/planB";

const pintar = async (repo: RepositorioPlanB = crearRepositorioPlanBDemo(), nombre?: string) => {
  const alAtras = jest.fn();
  await render(
    <PantallaPlanB
      repo={repo}
      estudianteIds={["ale"]}
      fecha="2026-11-26"
      nombreAlumno={nombre}
      alAtras={alAtras}
    />,
  );
  await screen.findByTestId("activar-plan-b-a1");
  return { repo, alAtras };
};

const filaDe = async (repo: RepositorioPlanB, id: string) =>
  (await repo.cargar(["ale"], "2026-11-26")).filas.find((f) => f.clave === id)!;

describe("Pantallas 47b y 47c del Plan B (SCRUM-139)", () => {
  it("47c: Plan B de la clase, sin botones por alumno ni vista de la tableta", async () => {
    await pintar();
    expect(screen.getByText("Plan B general de la clase")).toBeTruthy();
    expect(screen.getAllByText("Tarea principal del aula")).toHaveLength(3);
    expect(screen.queryByText(/Solo /)).toBeNull();
    expect(screen.queryByText(/tableta/i)).toBeNull();
  });

  it("47b: lleva el nombre del alumno", async () => {
    await pintar(undefined, "Alejandro");
    expect(screen.getByText("Plan B de Alejandro")).toBeTruthy();
  });

  it("activa y quita el Plan B de una tarea", async () => {
    const { repo } = await pintar();
    await fireEvent.press(screen.getByTestId("activar-plan-b-a1"));
    await waitFor(async () => expect((await filaDe(repo, "a1")).activo).toBe(true));
    await screen.findByText("Plan B activado en «Asamblea matinal».");

    await fireEvent.press(screen.getByTestId("activar-plan-b-a1"));
    await waitFor(async () => expect((await filaDe(repo, "a1")).activo).toBe(false));
  });

  it("activa el Plan B en todo el día y se puede quitar", async () => {
    const { repo } = await pintar();
    await fireEvent.press(screen.getByRole("button", { name: "Activar Plan B en todo el día" }));
    await screen.findByRole("button", { name: "Quitar Plan B de todo el día" });
    expect((await repo.cargar([], "")).filas.every((f) => f.activo)).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "Quitar Plan B de todo el día" }));
    await screen.findByRole("button", { name: "Activar Plan B en todo el día" });
    expect((await repo.cargar([], "")).filas.some((f) => f.activo)).toBe(false);
  });

  it("vincula como Plan B otra tarea ya creada, elegida a pantalla completa", async () => {
    const { repo } = await pintar();
    await fireEvent.press(screen.getByTestId("editar-plan-b-a1"));
    await fireEvent.press(
      screen.getByRole("button", { name: /2\. Tarea Plan B asignada \(ya creada\)/ }),
    );
    // La propia tarea principal no se puede elegir.
    expect(screen.queryByTestId("opcion-plan-b-t-asamblea")).toBeNull();
    await fireEvent.press(screen.getByTestId("opcion-plan-b-t-juegos"));
    await fireEvent.press(screen.getByRole("button", { name: "Vincular Plan B" }));

    await waitFor(async () => expect((await filaDe(repo, "a1")).planB?.id).toBe("t-juegos"));
  });

  it("avisa si no se puede guardar", async () => {
    const repo = crearRepositorioPlanBDemo();
    repo.activar = jest.fn().mockRejectedValue(new Error("sin red"));
    await pintar(repo);
    await fireEvent.press(screen.getByTestId("activar-plan-b-a1"));
    expect(await screen.findByText(ERROR_GUARDAR_PLAN_B)).toBeTruthy();
  });

  it("«Atrás» vuelve a la pantalla anterior", async () => {
    const { alAtras } = await pintar();
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alAtras).toHaveBeenCalled();
  });
});
