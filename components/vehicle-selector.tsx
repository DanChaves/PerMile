import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getVehicleDetails,
  getVehicleMakes,
  getVehicleModels,
  getVehicleOptions,
  getVehicleYears,
  type VehicleDetails,
  type VehicleOption,
} from "@/services/fuel-economy-api";

type VehicleSelectorProps = {
  onVehicleSelected: (vehicle: VehicleDetails, configuration: string) => void;
};

type PickerField = "year" | "make" | "model" | "configuration";

export function VehicleSelector({
  onVehicleSelected,
}: VehicleSelectorProps) {
  const [year, setYear] = useState<VehicleOption>();
  const [make, setMake] = useState<VehicleOption>();
  const [model, setModel] = useState<VehicleOption>();
  const [configuration, setConfiguration] = useState<VehicleOption>();

  const [years, setYears] = useState<VehicleOption[]>([]);
  const [makes, setMakes] = useState<VehicleOption[]>([]);
  const [models, setModels] = useState<VehicleOption[]>([]);
  const [configurations, setConfigurations] = useState<VehicleOption[]>([]);

  const [activeField, setActiveField] = useState<PickerField>();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadYears() {
      setLoading(true);
      setError("");

      try {
        setYears(await getVehicleYears());
      } catch {
        setError("Vehicle data could not be loaded. You can enter MPG manually.");
      } finally {
        setLoading(false);
      }
    }

    void loadYears();
  }, []);

  const optionsByField: Record<PickerField, VehicleOption[]> = {
    year: years,
    make: makes,
    model: models,
    configuration: configurations,
  };

  const activeOptions = activeField ? optionsByField[activeField] : [];
  const filteredOptions = activeOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  function openField(field: PickerField) {
    setSearchQuery("");
    setActiveField(field);
  }

  async function chooseOption(option: VehicleOption) {
    if (!activeField) {
      return;
    }

    const field = activeField;
    setActiveField(undefined);
    setLoading(true);
    setError("");

    try {
      if (field === "year") {
        setYear(option);
        setMake(undefined);
        setModel(undefined);
        setConfiguration(undefined);
        setModels([]);
        setConfigurations([]);
        setMakes(await getVehicleMakes(option.value));
      } else if (field === "make" && year) {
        setMake(option);
        setModel(undefined);
        setConfiguration(undefined);
        setConfigurations([]);
        setModels(await getVehicleModels(year.value, option.value));
      } else if (field === "model" && year && make) {
        setModel(option);
        setConfiguration(undefined);
        setConfigurations(
          await getVehicleOptions(year.value, make.value, option.value),
        );
      } else if (field === "configuration") {
        setConfiguration(option);
        onVehicleSelected(await getVehicleDetails(option.value), option.label);
      }
    } catch {
      setError("Something went wrong while loading vehicle data. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Find your vehicle</Text>
      <Text style={styles.description}>
        Select each field to automatically load its EPA fuel economy.
      </Text>

      <SelectorButton
        label="Model year"
        value={year?.label}
        onPress={() => openField("year")}
      />
      <SelectorButton
        label="Make"
        value={make?.label}
        disabled={!year}
        onPress={() => openField("make")}
      />
      <SelectorButton
        label="Model"
        value={model?.label}
        disabled={!make}
        onPress={() => openField("model")}
      />
      <SelectorButton
        label="Engine / configuration"
        value={configuration?.label}
        disabled={!model}
        onPress={() => openField("configuration")}
      />

      {loading && <ActivityIndicator style={styles.status} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        animationType="slide"
        transparent
        visible={Boolean(activeField)}
        onRequestClose={() => setActiveField(undefined)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setActiveField(undefined)}
        >
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select {activeField}</Text>
              <Pressable onPress={() => setActiveField(undefined)}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyText}>No matching options found.</Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => void chooseOption(item)}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

type SelectorButtonProps = {
  label: string;
  value?: string;
  disabled?: boolean;
  onPress: () => void;
};

function SelectorButton({
  label,
  value,
  disabled,
  onPress,
}: SelectorButtonProps) {
  return (
    <Pressable
      style={[styles.selector, disabled && styles.selectorDisabled]}
      disabled={disabled}
      onPress={onPress}
    >
      <View style={styles.selectorText}>
        <Text style={styles.selectorLabel}>{label}</Text>
        <Text style={value ? styles.selectorValue : styles.placeholder}>
          {value ?? `Select ${label.toLowerCase()}`}
        </Text>
      </View>
      <Text style={styles.chevron}>&gt;</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  selector: {
    alignItems: "center",
    borderColor: "#ccc",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 60,
    paddingHorizontal: 14,
  },
  selectorDisabled: {
    backgroundColor: "#f3f3f3",
    opacity: 0.55,
  },
  selectorText: {
    flex: 1,
    paddingRight: 12,
  },
  selectorLabel: {
    color: "#666",
    fontSize: 12,
    marginBottom: 3,
  },
  selectorValue: {
    color: "#111",
    fontSize: 16,
  },
  placeholder: {
    color: "#777",
    fontSize: 16,
  },
  chevron: {
    color: "#555",
    fontSize: 20,
    fontWeight: "700",
  },
  status: {
    marginTop: 4,
  },
  error: {
    color: "#a52121",
    lineHeight: 20,
    marginTop: 4,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "75%",
    minHeight: "45%",
    padding: 20,
  },
  sheetHeader: {
    alignItems: "center",
    borderBottomColor: "#e5e5e5",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  close: {
    color: "#1769aa",
    fontSize: 16,
    fontWeight: "600",
  },
  searchInput: {
    borderColor: "#d8d8d8",
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    marginTop: 14,
    padding: 12,
  },
  emptyText: {
    color: "#666",
    paddingVertical: 24,
    textAlign: "center",
  },
  option: {
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  optionText: {
    fontSize: 16,
  },
});
