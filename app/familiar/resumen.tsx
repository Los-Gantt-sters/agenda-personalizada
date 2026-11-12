import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useSesion } from "../../src/sesion";

/**
 * Panel principal del Tutor Familiar en el Sprint 1.
 */
export default function FamiliarResumenScreen() {
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();

  const handleLogout = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Espacio Familiar · Agensible" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.badge}>ROL: FAMILIA / HOGAR</Text>
          <Text style={styles.title} accessibilityRole="header">
            Seguimiento Familiar en el Hogar
          </Text>
          <Text style={styles.subtitle}>
            {sesion?.user?.fullName ?? "Familia"} · CEE Fundación Purísima Concepción
          </Text>

          <View style={styles.grid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => router.push("/agenda")}
              accessibilityRole="button"
              accessibilityLabel="Ver agenda del estudiante"
            >
              <Text style={styles.buttonEmoji}>🏠</Text>
              <View style={styles.buttonTextWrap}>
                <Text style={styles.primaryButtonTitle}>Ver Agenda del Día</Text>
                <Text style={styles.primaryButtonSub}>
                  Consulta las actividades actuales y completadas (HU-06, HU-08)
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/preferencias")}
              accessibilityRole="button"
              accessibilityLabel="Ajustar preferencias visuales y sensoriales"
            >
              <Text style={styles.buttonEmoji}>🎨</Text>
              <View style={styles.buttonTextWrap}>
                <Text style={styles.buttonTitle}>Preferencias Sensoriales</Text>
                <Text style={styles.buttonSub}>
                  Configuración visual y auditiva adaptada al estudiante (HU-04)
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/demo-pictogramas")}
              accessibilityRole="button"
              accessibilityLabel="Explorar catálogo de pictogramas ARASAAC"
            >
              <Text style={styles.buttonEmoji}>🖼️</Text>
              <View style={styles.buttonTextWrap}>
                <Text style={styles.buttonTitle}>Catálogo de Pictogramas ARASAAC</Text>
                <Text style={styles.buttonSub}>
                  Buscador de apoyos visuales para rutinas del hogar (HUT-04)
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
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
    backgroundColor: "#E6FFFA",
    color: "#234E52",
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
    backgroundColor: "#2C7A7B",
    borderColor: "#234E52",
  },
  buttonEmoji: { fontSize: 32 },
  buttonTextWrap: { flex: 1 },
  primaryButtonTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF", marginBottom: 2 },
  primaryButtonSub: { fontSize: 14, color: "#E6FFFA" },
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
