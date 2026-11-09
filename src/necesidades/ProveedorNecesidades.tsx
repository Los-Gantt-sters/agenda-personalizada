import React, { createContext, useContext, useState, ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { BotonNecesidades } from "./BotonNecesidades";
import { PosicionBotonNecesidades, VarianteColorNecesidades } from "./tipos";

interface NecesidadesContextType {
  mostrarBotonNecesidades: boolean;
  setMostrarBotonNecesidades: (mostrar: boolean) => void;
  posicionBoton: PosicionBotonNecesidades;
  setPosicionBoton: (posicion: PosicionBotonNecesidades) => void;
  varianteBoton: VarianteColorNecesidades;
  setVarianteBoton: (variante: VarianteColorNecesidades) => void;
  abrirModalNecesidades: () => void;
  modalAbierto: boolean;
  cerrarModalNecesidades: () => void;
}

const NecesidadesContext = createContext<NecesidadesContextType | undefined>(undefined);

export interface ProveedorNecesidadesProps {
  children: ReactNode;
  inicialmenteVisible?: boolean;
  posicionInicial?: PosicionBotonNecesidades;
  varianteInicial?: VarianteColorNecesidades;
  onPulsarNecesidades?: () => void;
}

export const ProveedorNecesidades: React.FC<ProveedorNecesidadesProps> = ({
  children,
  inicialmenteVisible = true,
  posicionInicial = "inferior-izquierda",
  varianteInicial = "estandar",
  onPulsarNecesidades,
}) => {
  const [mostrarBotonNecesidades, setMostrarBotonNecesidades] =
    useState<boolean>(inicialmenteVisible);
  const [posicionBoton, setPosicionBoton] = useState<PosicionBotonNecesidades>(posicionInicial);
  const [varianteBoton, setVarianteBoton] = useState<VarianteColorNecesidades>(varianteInicial);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);

  const abrirModalNecesidades = () => {
    setModalAbierto(true);
    if (onPulsarNecesidades) {
      onPulsarNecesidades();
    }
  };

  const cerrarModalNecesidades = () => {
    setModalAbierto(false);
  };

  return (
    <NecesidadesContext.Provider
      value={{
        mostrarBotonNecesidades,
        setMostrarBotonNecesidades,
        posicionBoton,
        setPosicionBoton,
        varianteBoton,
        setVarianteBoton,
        abrirModalNecesidades,
        modalAbierto,
        cerrarModalNecesidades,
      }}
    >
      <View style={estilos.contenedorRaiz}>
        {children}

        {mostrarBotonNecesidades && (
          <BotonNecesidades
            onPress={abrirModalNecesidades}
            posicion={posicionBoton}
            variante={varianteBoton}
          />
        )}
      </View>
    </NecesidadesContext.Provider>
  );
};

export const useNecesidades = (): NecesidadesContextType => {
  const context = useContext(NecesidadesContext);
  if (!context) {
    throw new Error("useNecesidades debe ser utilizado dentro de un ProveedorNecesidades");
  }
  return context;
};

const estilos = StyleSheet.create({
  contenedorRaiz: {
    flex: 1,
    position: "relative",
  },
});
