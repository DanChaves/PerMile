import * as SQLite from "expo-sqlite";

import type { VehicleDetails } from "@/services/fuel-economy-api";

const db = SQLite.openDatabaseSync("permile.db");

export type SavedVehicle = VehicleDetails & {
  databaseId: number;
  configuration?: string;
};

export type CalculationHistoryItem = {
  id: number;
  vehicleLabel: string;
  gasPrice: number;
  tripMiles: number;
  mpg: number;
  costPerMile: number;
  tripCost: number;
  gallonsNeeded: number;
  createdAt: string;
};

type VehicleRow = {
  id: number;
  epa_vehicle_id: string;
  year: number;
  make: string;
  model: string;
  configuration: string | null;
  city_mpg: number;
  highway_mpg: number;
  combined_mpg: number;
};

type CalculationRow = {
  id: number;
  vehicle_label: string | null;
  gas_price: number;
  trip_miles: number;
  mpg: number;
  cost_per_mile: number;
  trip_cost: number;
  gallons_needed: number;
  created_at: string;
};

export async function initializeDatabase() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      epa_vehicle_id TEXT NOT NULL UNIQUE,
      year INTEGER NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      configuration TEXT,
      city_mpg REAL NOT NULL,
      highway_mpg REAL NOT NULL,
      combined_mpg REAL NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER,
      vehicle_label TEXT,
      gas_price REAL NOT NULL,
      trip_miles REAL NOT NULL,
      mpg REAL NOT NULL,
      cost_per_mile REAL NOT NULL,
      trip_cost REAL NOT NULL,
      gallons_needed REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );
  `);
}

export async function saveDefaultVehicle(
  vehicle: VehicleDetails,
  configuration?: string,
) {
  await db.runAsync("UPDATE vehicles SET is_default = 0");

  await db.runAsync(
    `
      INSERT INTO vehicles (
        epa_vehicle_id,
        year,
        make,
        model,
        configuration,
        city_mpg,
        highway_mpg,
        combined_mpg,
        is_default
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(epa_vehicle_id) DO UPDATE SET
        year = excluded.year,
        make = excluded.make,
        model = excluded.model,
        configuration = excluded.configuration,
        city_mpg = excluded.city_mpg,
        highway_mpg = excluded.highway_mpg,
        combined_mpg = excluded.combined_mpg,
        is_default = 1
    `,
    [
      vehicle.id,
      vehicle.year,
      vehicle.make,
      vehicle.model,
      configuration ?? null,
      vehicle.cityMpg,
      vehicle.highwayMpg,
      vehicle.combinedMpg,
    ],
  );

  return getDefaultVehicle();
}

export async function getDefaultVehicle(): Promise<SavedVehicle | undefined> {
  const row = await db.getFirstAsync<VehicleRow>(
    `
      SELECT *
      FROM vehicles
      WHERE is_default = 1
      ORDER BY created_at DESC
      LIMIT 1
    `,
  );

  return row ? mapVehicleRow(row) : undefined;
}

export async function saveCalculation(input: {
  vehicleDatabaseId?: number;
  vehicleLabel?: string;
  gasPrice: number;
  tripMiles: number;
  mpg: number;
  costPerMile: number;
  tripCost: number;
  gallonsNeeded: number;
}) {
  await db.runAsync(
    `
      INSERT INTO calculations (
        vehicle_id,
        vehicle_label,
        gas_price,
        trip_miles,
        mpg,
        cost_per_mile,
        trip_cost,
        gallons_needed
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.vehicleDatabaseId ?? null,
      input.vehicleLabel ?? null,
      input.gasPrice,
      input.tripMiles,
      input.mpg,
      input.costPerMile,
      input.tripCost,
      input.gallonsNeeded,
    ],
  );
}

export async function getRecentCalculations(limit = 5) {
  const rows = await db.getAllAsync<CalculationRow>(
    `
      SELECT
        calculations.id,
        COALESCE(
          calculations.vehicle_label,
          vehicles.year || ' ' || vehicles.make || ' ' || vehicles.model,
          'Manual MPG'
        ) AS vehicle_label,
        calculations.gas_price,
        calculations.trip_miles,
        calculations.mpg,
        calculations.cost_per_mile,
        calculations.trip_cost,
        calculations.gallons_needed,
        calculations.created_at
      FROM calculations
      LEFT JOIN vehicles ON vehicles.id = calculations.vehicle_id
      ORDER BY calculations.created_at DESC
      LIMIT ?
    `,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    vehicleLabel: row.vehicle_label ?? "Manual MPG",
    gasPrice: row.gas_price,
    tripMiles: row.trip_miles,
    mpg: row.mpg,
    costPerMile: row.cost_per_mile,
    tripCost: row.trip_cost,
    gallonsNeeded: row.gallons_needed,
    createdAt: row.created_at,
  }));
}

function mapVehicleRow(row: VehicleRow): SavedVehicle {
  return {
    databaseId: row.id,
    id: row.epa_vehicle_id,
    year: row.year,
    make: row.make,
    model: row.model,
    configuration: row.configuration ?? undefined,
    cityMpg: row.city_mpg,
    highwayMpg: row.highway_mpg,
    combinedMpg: row.combined_mpg,
  };
}
