import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useSesion } from "../../src/sesion";

/**
 * Panel principal del Tutor Docente en el Sprint 1.
 * Centraliza el acceso a las vistas operativas de agenda, preferencias sensoriales,
 * buscador ARASAAC y reloj visual Time Timer.
 */
export default function DocenteAgendaScreen() {
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();

  const handleLogout = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Panel Tutor Docente · Agensible" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.badge}>ROL: TUTOR DOCENTE</Text>
          <Text style={styles.title} accessibilityRole="header">
            Panel de Supervisión Escolar
          </Text>
          <Text style={styles.subtitle}>
            {sesion?.user?.fullName ?? "Tutor Docente"} · CEE Fundación Purísima Concepción
          </Text>

          <View style={styles.grid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => router.push("/agenda")}
              accessibilityRole="button"
              accessibilityLabel="Abrir agenda estructurada del estudiante"
            >
              <Text style={styles.buttonEmoji}>📅</Text>
              <View style={styles.buttonTextWrap}>
                <Text style={styles.primaryButtonTitle}>
                  Agenda del Día (Hecho / Ahora / Después)
                </Text>
                <Text style={styles.primaryButtonSub}>
                  Vista estructurada del alumno, pasos y registro de tiempos (HU-06, HU-08)
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/agenda?aviso=prueba")}
              accessibilityRole="button"
              accessibilityLabel="Probar notificación anticipatoria de cambio de actividad"
            >
              <Text style={styles.buttonEmoji}>🔔</Text>
              <View style={styles.buttonTextWrap}>
                <Text style={styles.buttonTitle}>Simular Aviso Anticipatorio (5 min antes)</Text>
                <Text style={styles.buttonSub}>
                  Dispara el aviso sensorial de cambio de tarea en pocos segundos (HU-16)
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/preferencias")}
              accessibilityRole="button"
              accessibilityLabel="Configurar preferencias sensoriales y temas visuales"
            >
              <Text style={styles.buttonEmoji}>🎨</Text>
              <View style={styles.buttonTextWrap}>
                <Text style={styles.buttonTitle}>Preferencias Sensoriales y Accesibilidad</Text>
                <Text style={styles.buttonSub}>
                  Paletas de color, alto contraste AAA, tamaños y modo calma (HU-04)
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/demo-pictogramas")}
              accessibilityRole="button"
              accessibilityLabel="Abrir buscador de pictogramas ARASAAC"
            >
              <Text style={styles.buttonEmoji}>🖼️</Text>
              <View style={styles.buttonTextWrap}>
                <Text style={styles.buttonTitle}>Catálogo y Buscador ARASAAC</Text>
                <Text style={styles.buttonSub}>
                  Búsqueda en directo de pictogramas oficiales con caché (HUT-04)
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/demo-reloj")}
              accessibilityRole="button"
              accessibilityLabel="Abrir demostración de reloj visual Time Timer"
            >
              <Text style={styles.buttonEmoji}>⏱️</Text>
              <View style={styles.buttonTextWrap}>
                <Text style={styles.buttonTitle}>Reloj Visual (Time Timer)</Text>
                <Text style={styles.buttonSub}>
                  Disco progresivo de tiempo restante sin números complejos (HU-14)
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión y volver al inicio"
          >
            <Text style={styles.logoutText}>⬅ Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7FAFC" },
  container: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  card: {
    width: "100%",
    maxWidth: 680,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#EBF8FF",
    color: "#2B6CB0",
    fontWeight: "800",
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#1A365D", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#4A5568", marginBottom: 24 },
  grid: { gap: 14, marginBottom: 24 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#CBD5E0",
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  primaryButton: {
    backgroundColor: "#2B6CB0",
    borderColor: "#1A365D",
  },
  buttonEmoji: { fontSize: 32 },
  buttonTextWrap: { flex: 1 },
  primaryButtonTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF", marginBottom: 2 },
  primaryButtonSub: { fontSize: 14, color: "#EBF8FF" },
  buttonTitle: { fontSize: 17, fontWeight: "700", color: "#1A202C", marginBottom: 2 },
  buttonSub: { fontSize: 14, color: "#4A5568" },
  logoutButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#EDF2F7",
    borderWidth: 1,
    borderColor: "#CBD5E0",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#2D3748" },
});
