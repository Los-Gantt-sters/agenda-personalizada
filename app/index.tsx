import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agensible</Text>
      <Text style={styles.subtitle}>
        Agenda visual accesible · CEE Fundación Purísima Concepción
      </Text>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.studentButton}
          onPress={() => router.push("/login-estudiantes")}
          accessibilityRole="button"
          accessibilityLabel="Entrar como estudiante tocando tu foto"
          testID="btn-acceso-estudiantes"
        >
          <Text style={styles.studentButtonEmoji}>🎒</Text>
          <Text style={styles.studentButtonText}>Entrar como Estudiante</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supervisorButton}
          onPress={() => router.push("/login")}
          accessibilityRole="button"
          accessibilityLabel="Acceder como tutor, familiar o administrador"
          testID="btn-acceso-supervisores"
        >
          <Text style={styles.supervisorButtonText}>Acceso Supervisores</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FAFC",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A365D",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#4A5568",
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 400,
  },
  buttonGroup: {
    gap: 16,
    width: "100%",
    maxWidth: 320,
    alignItems: "stretch",
  },
  studentButton: {
    backgroundColor: "#319795",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 56,
    shadowColor: "#319795",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  studentButtonEmoji: {
    fontSize: 24,
  },
  studentButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  supervisorButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CBD5E0",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  supervisorButtonText: {
    color: "#2B6CB0",
    fontSize: 16,
    fontWeight: "700",
  },
});
