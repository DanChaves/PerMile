import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { VehicleSelector } from "@/components/vehicle-selector";
import type { VehicleDetails } from "@/services/fuel-economy-api";

export default function HomeScreen() {
  // logic
  const [gasPrice, setGasPrice] = useState("");
  const [mpg, setMpg] = useState("");
  const [miles, setMiles] = useState("");
  const [gasTaxPercentage, setGasTax] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDetails>();

  const tax = Number(gasTaxPercentage);
  const price = Number(gasPrice);
  const fuelMpg = Number(mpg);
  const tripMiles = Number(miles);

  const handlePress = () => {
    console.log("Button clicked!");
  };

  const handleclearPress = () => {
    setGasPrice("");
    setMpg("");
    setGasTax("");
    setMiles("");
  };

  const handleVehicleSelected = (vehicle: VehicleDetails) => {
    setSelectedVehicle(vehicle);
    setMpg(String(vehicle.combinedMpg));
  };

  const costPerMile =
    price && fuelMpg ? (price / fuelMpg) * (1 - tax * 0.01) : 0;
  const tripCost = costPerMile * tripMiles;
  const gallonsNeeded =
    fuelMpg > 0 && tripMiles / fuelMpg ? tripMiles / fuelMpg : 0;
  // visual layout
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>PerMile</Text>
      <Text style={styles.subtitle}>
        Calculate what your drive really costs.
      </Text>

      <VehicleSelector onVehicleSelected={handleVehicleSelected} />

      {selectedVehicle && (
        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleCardTitle}>
            {selectedVehicle.year} {selectedVehicle.make}{" "}
            {selectedVehicle.model}
          </Text>
          <Text style={styles.vehicleCardText}>
            {selectedVehicle.combinedMpg} combined MPG ·{" "}
            {selectedVehicle.cityMpg} city · {selectedVehicle.highwayMpg} highway
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Trip details</Text>

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
        <Text>Gallons needed: {gallonsNeeded.toFixed(2)}</Text>
      </View>

      {fuelMpg < 15 && fuelMpg > 0 && (
        <View style={styles.warningBox}>
          <Text>Warning: your car blows</Text>
        </View>
      )}

      <Pressable style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Calculate</Text>
      </Pressable>

      <Pressable style={styles.clearButton} onPress={handleclearPress}>
        <Text style={styles.buttonText}>Clear</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 48,
    paddingTop: 64,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  vehicleCard: {
    backgroundColor: "#eef6ff",
    borderColor: "#b8d9f7",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    padding: 14,
  },
  vehicleCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  vehicleCardText: {
    color: "#3f5264",
    lineHeight: 20,
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
  warningBox: {
    padding: 16,
    backgroundColor: "orange",
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "black",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: "red",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
