import React, { createContext, useContext, useState, ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { BotonNecesidades } from "./BotonNecesidades";
import { ModalNecesidades } from "./ModalNecesidades";
import { PosicionBotonNecesidades, VarianteColorNecesidades, ClaveNecesidad } from "./tipos";

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
  ultimaNecesidadSolicitada: ClaveNecesidad | null;
  solicitarNecesidad: (clave: ClaveNecesidad) => void;
}

const NecesidadesContext = createContext<NecesidadesContextType | undefined>(undefined);

export interface ProveedorNecesidadesProps {
  children: ReactNode;
  inicialmenteVisible?: boolean;
  posicionInicial?: PosicionBotonNecesidades;
  varianteInicial?: VarianteColorNecesidades;
  onPulsarNecesidades?: () => void;
  onSolicitarNecesidad?: (clave: ClaveNecesidad) => void;
  nombreTutora?: string;
}

export const ProveedorNecesidades: React.FC<ProveedorNecesidadesProps> = ({
  children,
  inicialmenteVisible = true,
  posicionInicial = "inferior-izquierda",
  varianteInicial = "estandar",
  onPulsarNecesidades,
  onSolicitarNecesidad,
  nombreTutora = "Carmen",
}) => {
  const [mostrarBotonNecesidades, setMostrarBotonNecesidades] =
    useState<boolean>(inicialmenteVisible);
  const [posicionBoton, setPosicionBoton] = useState<PosicionBotonNecesidades>(posicionInicial);
  const [varianteBoton, setVarianteBoton] = useState<VarianteColorNecesidades>(varianteInicial);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [necesidadEnviada, setNecesidadEnviada] = useState<ClaveNecesidad | null>(null);
  const [ultimaNecesidadSolicitada, setUltimaNecesidadSolicitada] = useState<ClaveNecesidad | null>(
    null,
  );

  const abrirModalNecesidades = () => {
    setNecesidadEnviada(null);
    setModalAbierto(true);
    if (onPulsarNecesidades) {
      onPulsarNecesidades();
    }
  };

  const cerrarModalNecesidades = () => {
    setModalAbierto(false);
    setNecesidadEnviada(null);
  };

  const solicitarNecesidad = (clave: ClaveNecesidad) => {
    setNecesidadEnviada(clave);
    setUltimaNecesidadSolicitada(clave);
    if (onSolicitarNecesidad) {
      onSolicitarNecesidad(clave);
    }
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
        ultimaNecesidadSolicitada,
        solicitarNecesidad,
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

        <ModalNecesidades
          visible={modalAbierto}
          alSeleccionarNecesidad={solicitarNecesidad}
          alCerrar={cerrarModalNecesidades}
          necesidadEnviada={necesidadEnviada}
          alConfirmarAvisoEnviado={cerrarModalNecesidades}
          nombreTutora={nombreTutora}
          variante={varianteBoton}
        />
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
