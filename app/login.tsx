/**
 * Pantalla 05 — Acceso para adultos sin selección manual de rol ni botón demo alumno
 * siguiendo exactamente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/05.html`
 * (SCRUM-228 / SCRUM-243 · MOD HU-02).
 *
 * Características clave del boceto definitivo:
 * - Cabecera con título «Acceso para adultos», icono de llave y chip derecho «Sin sesión».
 * - Columna izquierda con identidad «Hospitalarias · Fundación Purísima Concepción» y texto:
 *   «Acceso único para personal del centro y familias. El sistema detecta automáticamente tu rol desde la base de datos.»
 * - SIN botones de selección manual de rol («Docente», «Familia», «Admin») ni botón demo de alumno.
 * - Tarjeta derecha con campos «Correo electrónico», «Contraseña» (con botón mostrar/ocultar)
 *   y botón primario «Iniciar sesión» que redirige automáticamente según el rol de BBDD
 *   (Tutor -> 33, Familia -> 34, Admin -> 48, Cocina -> 54).
 */

import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Pantalla } from "../src/pantalla";
import { getRoleHomeRoute, signInSupervisor } from "../src/servicios/authService";
import type { Paleta } from "../src/temas";
import { AUTH_GENERIC_ERROR_MESSAGE } from "../src/tipos/auth";
import { Icono, LogoColegio, Texto, useApariencia, useEstilos } from "../src/ui";

export default function LoginScreen() {
  const router = useRouter();
  const { colores, fuente } = useApariencia();
  const styles = useEstilos(crearEstilos);

  const [email, setEmail] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (emailVal = email, passwordVal = password): boolean => {
    const errors: { email?: string; password?: string } = {};

    const trimmedEmail = emailVal.trim();
    if (!trimmedEmail) {
      errors.email = "El correo electrónico es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Introduce un formato de correo electrónico válido.";
    }

    if (!passwordVal) {
      errors.password = "La contraseña es obligatoria.";
    } else if (passwordVal.length < 6) {
      errors.password = "La contraseña debe contener al menos 6 caracteres.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!validateForm(email, password)) {
      return;
    }

    setLoading(true);
    try {
      const result = await signInSupervisor(email, password);

      if (result.success && result.session) {
        const targetRoute = getRoleHomeRoute(result.session.user.role);
        router.replace(targetRoute as never);
      } else {
        setErrorMessage(result.error || AUTH_GENERIC_ERROR_MESSAGE);
      }
    } catch {
      setErrorMessage(AUTH_GENERIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const derechaSinSesion = (
    <View style={styles.chipSinSesion} testID="chip-sin-sesion-05">
      <Icono nombre="persona" color={colores.textoSecundario} tam={20} />
      <Texto style={styles.textoSinSesion}>Sin sesión</Texto>
    </View>
  );

  return (
    <Pantalla
      titulo="Acceso para adultos"
      simbolo={<Icono nombre="llave" color={colores.primario} tam={32} />}
      derecha={derechaSinSesion}
      // Se llega desde «¿Cuál es tu clase?» (01); si se entra directo a /login, Atrás lleva a esa pantalla
      alAtras={() => (router.canGoBack?.() ? router.back() : router.replace("/"))}
      etiquetaAtras="Atrás: volver a elegir clase"
      sinAyuda
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Columna izquierda: identidad del centro y aviso de detección automática de rol (05.html) */}
          <View style={styles.columnaLateral} testID="columna-identidad-05">
            <LogoColegio ancho={300} />
            <Texto style={styles.marcaTitulo}>Hospitalarias</Texto>
            <Texto style={styles.marcaSubtitulo}>Fundación Purísima Concepción</Texto>
            <Texto style={styles.subtitle} testID="texto-rol-automatico-05">
              Acceso único para personal del centro y familias. El sistema detecta automáticamente
              tu rol desde la base de datos.
            </Texto>
          </View>

          {/* Tarjeta derecha: formulario único Correo + Contraseña + Iniciar sesión */}
          <View style={styles.card} testID="tarjeta-login-adultos-05">
            {errorMessage && (
              <View
                style={styles.errorAlert}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                <Icono nombre="alerta" color={colores.peligro} tam={24} />
                <Texto style={styles.errorAlertText}>{errorMessage}</Texto>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Texto nativeID="emailLabel" style={styles.label}>
                Correo electrónico
              </Texto>
              <TextInput
                testID="input-correo-05"
                style={[
                  styles.input,
                  { fontFamily: fuente.normal },
                  validationErrors.email ? styles.inputError : null,
                ]}
                placeholder="usuario@purisima.es"
                placeholderTextColor={colores.textoSecundario}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (validationErrors.email) {
                    setValidationErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                accessibilityLabel="Correo electrónico del supervisor"
                accessibilityHint="Introduce tu dirección de correo electrónico institucional"
                accessibilityLabelledBy="emailLabel"
                editable={!loading}
              />
              {validationErrors.email && <ErrorCampo texto={validationErrors.email} />}
            </View>

            <View style={styles.fieldGroup}>
              <Texto nativeID="passwordLabel" style={styles.label}>
                Contraseña
              </Texto>
              <View>
                <TextInput
                  testID="input-password-05"
                  style={[
                    styles.input,
                    { fontFamily: fuente.normal },
                    styles.inputConBoton,
                    validationErrors.password ? styles.inputError : null,
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={colores.textoSecundario}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (validationErrors.password) {
                      setValidationErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  secureTextEntry={!verPassword}
                  autoCapitalize="none"
                  accessibilityLabel="Contraseña del supervisor"
                  accessibilityHint="Introduce tu contraseña segura"
                  accessibilityLabelledBy="passwordLabel"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.botonVer}
                  onPress={() => setVerPassword((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <Icono
                    nombre={verPassword ? "ojoTachado" : "ojo"}
                    color={colores.textoSecundario}
                    tam={24}
                  />
                </TouchableOpacity>
              </View>
              {validationErrors.password && <ErrorCampo texto={validationErrors.password} />}
            </View>

            <TouchableOpacity
              testID="btn-iniciar-sesion-05"
              style={[styles.submitButton, loading ? styles.submitButtonDisabled : null]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={loading ? "Iniciando sesión" : "Iniciar sesión"}
              accessibilityState={{ busy: loading, disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color={colores.textoSobrePrimario} />
              ) : (
                <Texto style={styles.submitButtonText}>Iniciar sesión</Texto>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

/** Error de un campo: icono y texto, no solo el color rojo del borde. */
function ErrorCampo({ texto }: { texto: string }) {
  const { colores } = useApariencia();
  const styles = useEstilos(crearEstilos);
  return (
    <View style={styles.fieldError} accessibilityRole="alert">
      <Icono nombre="alerta" color={colores.peligro} tam={20} />
      <Texto style={styles.fieldErrorText}>{texto}</Texto>
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    keyboardContainer: {
      flex: 1,
      backgroundColor: c.fondo,
    },
    chipSinSesion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 44,
      paddingHorizontal: 14,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    textoSinSesion: {
      fontSize: 15,
      color: c.textoSecundario,
    },
    scrollContent: {
      flexGrow: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      alignContent: "center",
      gap: 48,
      padding: 20,
    },
    columnaLateral: {
      width: 360,
      gap: 8,
    },
    marcaTitulo: {
      fontSize: 32,
      fontWeight: "700",
      color: c.primario,
    },
    marcaSubtitulo: {
      fontSize: 18,
      color: c.primario,
    },
    subtitle: {
      marginTop: 10,
      fontSize: 17,
      lineHeight: 24,
      color: c.textoSecundario,
    },
    card: {
      width: "100%",
      maxWidth: 440,
      backgroundColor: c.superficie,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      padding: 28,
      gap: 18,
    },
    errorAlert: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 3,
      borderColor: c.peligro,
      borderRadius: 10,
      padding: 12,
    },
    errorAlertText: {
      flexShrink: 1,
      color: c.peligro,
      fontSize: 16,
      fontWeight: "700",
    },
    fieldGroup: {
      gap: 6,
    },
    label: {
      fontSize: 17,
      fontWeight: "700",
      color: c.texto,
    },
    input: {
      minHeight: 48,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 12,
      paddingHorizontal: 14,
      fontSize: 17,
      color: c.texto,
      backgroundColor: c.superficie,
    },
    inputConBoton: {
      paddingRight: 56,
    },
    inputError: {
      borderColor: c.peligro,
      borderWidth: 3,
    },
    botonVer: {
      position: "absolute",
      right: 4,
      top: 2,
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    fieldError: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    fieldErrorText: {
      flexShrink: 1,
      color: c.peligro,
      fontSize: 15,
      fontWeight: "700",
    },
    submitButton: {
      minHeight: 58,
      backgroundColor: c.primario,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: c.textoSobrePrimario,
      fontSize: 20,
      fontWeight: "700",
    },
  });
