import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { signInSupervisor, getRoleHomeRoute } from "../src/services/authService";
import { AUTH_GENERIC_ERROR_MESSAGE, SupervisorRole } from "../src/types/auth";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              Acceso Supervisores
            </Text>
            <Text style={styles.subtitle}>CEE Fundación Purísima Concepción · Agensible</Text>
          </View>

          {errorMessage && (
            <View
              style={styles.errorAlert}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              <Text style={styles.errorAlertText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text nativeID="emailLabel" style={styles.label}>
              Correo electrónico
            </Text>
            <TextInput
              style={[styles.input, validationErrors.email ? styles.inputError : null]}
              placeholder="ejemplo@purisima.es"
              placeholderTextColor="#A0AEC0"
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
            {validationErrors.email && (
              <Text style={styles.fieldErrorText} accessibilityRole="alert">
                {validationErrors.email}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text nativeID="passwordLabel" style={styles.label}>
              Contraseña
            </Text>
            <TextInput
              style={[styles.input, validationErrors.password ? styles.inputError : null]}
              placeholder="••••••••"
              placeholderTextColor="#A0AEC0"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (validationErrors.password) {
                  setValidationErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel="Contraseña del supervisor"
              accessibilityHint="Introduce tu contraseña segura"
              accessibilityLabelledBy="passwordLabel"
              editable={!loading}
            />
            {validationErrors.password && (
              <Text style={styles.fieldErrorText} accessibilityRole="alert">
                {validationErrors.password}
              </Text>
            )}
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
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <View style={styles.demoSection}>
            <Text style={styles.demoSectionTitle}>Accesos rápidos de prueba (Demo / QA):</Text>
            <View style={styles.demoButtonGroup}>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => setDemoRole("tutor_docente")}
                accessibilityRole="button"
                accessibilityLabel="Rellenar como Tutor Docente"
              >
                <Text style={styles.demoButtonText}>Docente</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => setDemoRole("familiar")}
                accessibilityRole="button"
                accessibilityLabel="Rellenar como Familia"
              >
                <Text style={styles.demoButtonText}>Familia</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => setDemoRole("admin")}
                accessibilityRole="button"
                accessibilityLabel="Rellenar como Administrador"
              >
                <Text style={styles.demoButtonText}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#EDF2F7",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 28,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A365D",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#4A5568",
    textAlign: "center",
  },
  errorAlert: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FEB2B2",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorAlertText: {
    color: "#C53030",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1A202C",
    backgroundColor: "#F7FAFC",
  },
  inputError: {
    borderColor: "#E53E3E",
    backgroundColor: "#FFF5F5",
  },
  fieldErrorText: {
    color: "#C53030",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  submitButton: {
    height: 50,
    backgroundColor: "#2B6CB0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#2B6CB0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: "#90CDF4",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  demoSection: {
    marginTop: 26,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    alignItems: "center",
  },
  demoSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#718096",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  demoButtonGroup: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  demoButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#EDF2F7",
    borderWidth: 1,
    borderColor: "#CBD5E0",
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2D3748",
  },
});
