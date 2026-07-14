import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { VehicleSelector } from "@/components/vehicle-selector";
import {
  getDefaultVehicle,
  getRecentCalculations,
  initializeDatabase,
  saveCalculation,
  saveDefaultVehicle,
  type CalculationHistoryItem,
  type SavedVehicle,
} from "@/services/database";
import type { VehicleDetails } from "@/services/fuel-economy-api";

type SelectedVehicle = VehicleDetails & {
  databaseId?: number;
  configuration?: string;
};

export default function HomeScreen() {
  const [gasPrice, setGasPrice] = useState("");
  const [mpg, setMpg] = useState("");
  const [miles, setMiles] = useState("");
  const [gasTaxPercentage, setGasTax] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<SelectedVehicle>();
  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [databaseReady, setDatabaseReady] = useState(false);

  const tax = parseNumber(gasTaxPercentage);
  const price = parseNumber(gasPrice);
  const fuelMpg = parseNumber(mpg);
  const tripMiles = parseNumber(miles);

  const costPerMile =
    price > 0 && fuelMpg > 0 ? (price * (1 + tax * 0.01)) / fuelMpg : 0;
  const tripCost = costPerMile * tripMiles;
  const gallonsNeeded = fuelMpg > 0 && tripMiles > 0 ? tripMiles / fuelMpg : 0;

  useEffect(() => {
    async function loadSavedData() {
      try {
        await initializeDatabase();
        const savedVehicle = await getDefaultVehicle();
        const recentHistory = await getRecentCalculations();

        if (savedVehicle) {
          setSelectedVehicle(savedVehicle);
          setMpg(String(savedVehicle.combinedMpg));
        }

        setHistory(recentHistory);
        setDatabaseReady(true);
      } catch {
        setStatusMessage("Saved data could not be loaded on this device.");
      }
    }

    void loadSavedData();
  }, []);

  async function handleVehicleSelected(
    vehicle: VehicleDetails,
    configuration: string,
  ) {
    setStatusMessage("");
    setMpg(String(vehicle.combinedMpg));

    try {
      const savedVehicle = await saveDefaultVehicle(vehicle, configuration);
      setSelectedVehicle(savedVehicle ?? { ...vehicle, configuration });
      setStatusMessage("Vehicle saved for next time.");
    } catch {
      setSelectedVehicle({ ...vehicle, configuration });
      setStatusMessage("Vehicle selected, but it could not be saved.");
    }
  }

  async function handleCalculate() {
    if (!validateInputs()) {
      return;
    }

    const vehicleLabel = selectedVehicle
      ? formatVehicleLabel(selectedVehicle)
      : "Manual MPG";

    try {
      await saveCalculation({
        vehicleDatabaseId: selectedVehicle?.databaseId,
        vehicleLabel,
        gasPrice: price,
        tripMiles,
        mpg: fuelMpg,
        costPerMile,
        tripCost,
        gallonsNeeded,
      });

      setHistory(await getRecentCalculations());
      setStatusMessage("Calculation saved.");
    } catch {
      setStatusMessage("Calculation worked, but history could not be saved.");
    }
  }

  function handleClearPress() {
    setGasPrice("");
    setGasTax("");
    setMiles("");
    setStatusMessage("");

    if (selectedVehicle) {
      setMpg(String(selectedVehicle.combinedMpg));
    } else {
      setMpg("");
    }
  }

  function validateInputs() {
    if (price <= 0) {
      Alert.alert("Missing gas price", "Enter a gas price greater than 0.");
      return false;
    }

    if (fuelMpg <= 0) {
      Alert.alert("Missing MPG", "Select a vehicle or enter MPG manually.");
      return false;
    }

    if (tripMiles <= 0) {
      Alert.alert("Missing trip miles", "Enter a trip distance greater than 0.");
      return false;
    }

    if (tax < 0) {
      Alert.alert("Invalid tax", "Tax and fees cannot be negative.");
      return false;
    }

    return true;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <Text style={styles.title}>PerMile</Text>
        <Text style={styles.subtitle}>
          Estimate what your drive really costs.
        </Text>
      </View>

      <VehicleSelector onVehicleSelected={handleVehicleSelected} />

      {selectedVehicle ? (
        <VehicleCard vehicle={selectedVehicle} />
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No vehicle saved yet</Text>
          <Text style={styles.emptyText}>
            Pick a vehicle above, or enter MPG manually below.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Trip details</Text>

      <LabeledInput
        label="Gas price per gallon"
        placeholder="Example: 3.49"
        value={gasPrice}
        onChangeText={setGasPrice}
      />

      <LabeledInput
        label="Vehicle MPG"
        placeholder="Example: 34"
        value={mpg}
        onChangeText={setMpg}
      />

      <LabeledInput
        label="Trip miles"
        placeholder="Example: 18"
        value={miles}
        onChangeText={setMiles}
      />

      <LabeledInput
        label="Tax and fees percent"
        placeholder="Optional"
        value={gasTaxPercentage}
        onChangeText={setGasTax}
      />

      <View style={styles.resultBox}>
        <Text style={styles.resultLabel}>Estimated trip cost</Text>
        <Text style={styles.resultTotal}>${tripCost.toFixed(2)}</Text>
        <Text style={styles.resultDetail}>
          ${costPerMile.toFixed(2)} per mile
        </Text>
        <Text style={styles.resultDetail}>
          {gallonsNeeded.toFixed(2)} gallons needed
        </Text>
      </View>

      {fuelMpg < 15 && fuelMpg > 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Low MPG detected. Your estimate may be especially sensitive to gas
            price changes.
          </Text>
        </View>
      )}

      {statusMessage ? (
        <Text style={styles.statusMessage}>{statusMessage}</Text>
      ) : null}

      <Pressable style={styles.button} onPress={() => void handleCalculate()}>
        <Text style={styles.buttonText}>Calculate and Save</Text>
      </Pressable>

      <Pressable style={styles.clearButton} onPress={handleClearPress}>
        <Text style={styles.clearButtonText}>Clear Trip</Text>
      </Pressable>

      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Recent history</Text>
        <Text style={styles.databaseStatus}>
          {databaseReady ? "SQLite ready" : "Loading"}
        </Text>
      </View>

      {history.length > 0 ? (
        history.map((item) => <HistoryCard key={item.id} item={item} />)
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No saved calculations</Text>
          <Text style={styles.emptyText}>
            Your last few trip estimates will appear here.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function LabeledInput(props: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{props.label}</Text>
      <TextInput
        style={styles.input}
        placeholder={props.placeholder}
        keyboardType="decimal-pad"
        value={props.value}
        onChangeText={props.onChangeText}
      />
    </View>
  );
}

function VehicleCard({ vehicle }: { vehicle: SelectedVehicle | SavedVehicle }) {
  return (
    <View style={styles.vehicleCard}>
      <Text style={styles.vehicleCardEyebrow}>Saved vehicle</Text>
      <Text style={styles.vehicleCardTitle}>{formatVehicleLabel(vehicle)}</Text>
      {vehicle.configuration ? (
        <Text style={styles.vehicleCardText}>{vehicle.configuration}</Text>
      ) : null}
      <Text style={styles.vehicleCardText}>
        {vehicle.combinedMpg} combined MPG | {vehicle.cityMpg} city |{" "}
        {vehicle.highwayMpg} highway
      </Text>
    </View>
  );
}

function HistoryCard({ item }: { item: CalculationHistoryItem }) {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyTopRow}>
        <Text style={styles.historyVehicle}>{item.vehicleLabel}</Text>
        <Text style={styles.historyCost}>${item.tripCost.toFixed(2)}</Text>
      </View>
      <Text style={styles.historyDetail}>
        {item.tripMiles.toFixed(1)} miles at {item.mpg.toFixed(1)} MPG
      </Text>
      <Text style={styles.historyDetail}>
        ${item.gasPrice.toFixed(2)}/gal | {item.gallonsNeeded.toFixed(2)} gal |{" "}
        {formatDate(item.createdAt)}
      </Text>
    </View>
  );
}

function parseNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatVehicleLabel(vehicle: SelectedVehicle | SavedVehicle) {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f6f7f9",
    flexGrow: 1,
    padding: 20,
    paddingBottom: 48,
    paddingTop: 64,
  },
  hero: {
    marginBottom: 24,
  },
  title: {
    color: "#111827",
    fontSize: 40,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    color: "#4b5563",
    fontSize: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  vehicleCard: {
    backgroundColor: "#eef6ff",
    borderColor: "#b8d9f7",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 22,
    padding: 16,
  },
  vehicleCardEyebrow: {
    color: "#1769aa",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  vehicleCardTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  vehicleCardText: {
    color: "#3f5264",
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 22,
    padding: 16,
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptyText: {
    color: "#6b7280",
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#d1d5db",
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    padding: 14,
  },
  resultBox: {
    backgroundColor: "#111827",
    borderRadius: 18,
    marginBottom: 16,
    marginTop: 8,
    padding: 18,
  },
  resultLabel: {
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  resultTotal: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 8,
  },
  resultDetail: {
    color: "#d1d5db",
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  warningText: {
    color: "#9a3412",
    lineHeight: 20,
  },
  statusMessage: {
    color: "#1769aa",
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 14,
    marginBottom: 10,
    padding: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  clearButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d1d5db",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 28,
    padding: 16,
  },
  clearButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "800",
  },
  historyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  databaseStatus: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  historyCard: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  historyTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  historyVehicle: {
    color: "#111827",
    flex: 1,
    fontWeight: "800",
    paddingRight: 8,
  },
  historyCost: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
  },
  historyDetail: {
    color: "#6b7280",
    lineHeight: 20,
  },
});
