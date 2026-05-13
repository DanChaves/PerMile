import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello World</Text>
      <Text style={styles.subtitle}>Put stuff here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
  },
});
