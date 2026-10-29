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

      <TouchableOpacity
        style={styles.supervisorButton}
        onPress={() => router.push("/login")}
        accessibilityRole="button"
        accessibilityLabel="Acceder como tutor, familiar o administrador"
      >
        <Text style={styles.supervisorButtonText}>Acceso Supervisores</Text>
      </TouchableOpacity>
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
  supervisorButton: {
    backgroundColor: "#2B6CB0",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: "#2B6CB0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  supervisorButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
