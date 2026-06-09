import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function HomeScreen() {
  // logic
  const [gasPrice, setGasPrice] = useState("");
  const [mpg, setMpg] = useState("");
  const [miles, setMiles] = useState("");
  const [gasTaxPercentage, setGasTax] = useState("");

  const tax = Number(gasTaxPercentage);
  const price = Number(gasPrice);
  const fuelMpg = Number(mpg);
  const tripMiles = Number(miles);

  const costPerMile =
    price && fuelMpg ? (price / fuelMpg) * (1 - tax * 0.01) : 0;
  const tripCost = costPerMile * tripMiles;
  // visual layout
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PerMile</Text>
      <Text style={styles.subtitle}>
        Calculate what your drive really costs.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="tax %"
        keyboardType="numeric"
        value={gasTaxPercentage}
        onChangeText={setGasTax}
      />

      <TextInput
        style={styles.input}
        placeholder="Gas price per gallon"
        keyboardType="numeric"
        value={gasPrice}
        onChangeText={setGasPrice}
      />

      <TextInput
        style={styles.input}
        placeholder="Your car MPG"
        keyboardType="numeric"
        value={mpg}
        onChangeText={setMpg}
      />

      <TextInput
        style={styles.input}
        placeholder="Trip miles"
        keyboardType="numeric"
        value={miles}
        onChangeText={setMiles}
      />

      <View style={styles.resultBox}>
        <Text>Cost per mile: ${costPerMile.toFixed(2)}</Text>
        <Text>Trip cost: ${tripCost.toFixed(2)}</Text>
      </View>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Calculate</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  resultBox: {
    padding: 16,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "black",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
