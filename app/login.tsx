import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { signInSupervisor, getRoleHomeRoute } from "../src/servicios/authService";
import { AUTH_GENERIC_ERROR_MESSAGE, SupervisorRole } from "../src/tipos/auth";
import type { Paleta } from "../src/temas";
import { Pantalla } from "../src/pantalla";
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

  const setDemoRole = (role: SupervisorRole) => {
    setErrorMessage(null);
    setValidationErrors({});
    switch (role) {
      case "admin":
        setEmail("admin@purisima.es");
        setPassword("AdminPurisima2026!");
        break;
      case "familiar":
        setEmail("familia.garcia@purisima.es");
        setPassword("FamiliaSegura2026!");
        break;
      case "especialista":
        setEmail("terapeuta@purisima.es");
        setPassword("Terapeuta2026!");
        break;
      case "tutor_docente":
      default:
        setEmail("tutor.docente@purisima.es");
        setPassword("TutorDocente2026!");
        break;
    }
  };

  return (
    <Pantalla
      titulo="Acceso para adultos"
      simbolo={<Icono nombre="llave" color={colores.primario} tam={32} />}
      // Se llega desde «¿Cuál es tu clase?»; si se entra directo a /login, Atrás lleva a esa pantalla
      alAtras={() => (router.canGoBack?.() ? router.back() : router.replace("/"))}
      etiquetaAtras="Atrás: volver a elegir clase"
      sinAyuda
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        {/* Solo se desplaza si sale el teclado; sin él, todo cabe en la pantalla. */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.columnaLateral}>
            <LogoColegio ancho={300} />
            <Texto style={styles.subtitle}>Tutores, familias y administración del colegio</Texto>
            <View style={styles.demoSection}>
              <Texto style={styles.demoSectionTitle}>Accesos de prueba (demo)</Texto>
              <View style={styles.demoButtonGroup}>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => setDemoRole("tutor_docente")}
                  accessibilityRole="button"
                  accessibilityLabel="Rellenar como Tutor Docente"
                >
                  <Texto style={styles.demoButtonText}>Docente</Texto>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => setDemoRole("familiar")}
                  accessibilityRole="button"
                  accessibilityLabel="Rellenar como Familia"
                >
                  <Texto style={styles.demoButtonText}>Familia</Texto>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => setDemoRole("admin")}
                  accessibilityRole="button"
                  accessibilityLabel="Rellenar como Administrador"
                >
                  <Texto style={styles.demoButtonText}>Admin</Texto>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.card}>
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
                style={[
                  styles.input,
                  { fontFamily: fuente.normal },
                  validationErrors.email ? styles.inputError : null,
                ]}
                placeholder="ejemplo@purisima.es"
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
                    tam={26}
                  />
                </TouchableOpacity>
              </View>
              {validationErrors.password && <ErrorCampo texto={validationErrors.password} />}
            </View>

            <TouchableOpacity
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
    // Dos columnas en la tableta: logo y accesos de prueba a la izquierda, formulario a la derecha
    scrollContent: {
      flexGrow: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      alignContent: "center",
      gap: 40,
      padding: 20,
    },
    columnaLateral: {
      width: 330,
      gap: 18,
    },
    card: {
      width: "100%",
      maxWidth: 460,
      backgroundColor: c.superficie,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.borde,
      padding: 28,
      gap: 18,
    },
    subtitle: {
      fontSize: 17,
      color: c.textoSecundario,
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
      minHeight: 56,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 10,
      paddingHorizontal: 16,
      fontSize: 18,
      color: c.texto,
      backgroundColor: c.superficie,
    },
    inputConBoton: {
      paddingRight: 60,
    },
    inputError: {
      borderColor: c.peligro,
      borderWidth: 3,
    },
    botonVer: {
      position: "absolute",
      right: 4,
      top: 4,
      width: 48,
      height: 48,
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
      minHeight: 60,
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
    demoSection: {
      width: "100%",
      gap: 8,
    },
    demoSectionTitle: {
      fontSize: 15,
      color: c.textoSecundario,
    },
    demoButtonGroup: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    demoButton: {
      minHeight: 48,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    demoButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
  });
