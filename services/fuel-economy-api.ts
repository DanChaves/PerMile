const API_BASE_URL = "https://www.fueleconomy.gov/ws/rest";

type ApiMenuItem = {
  text: string;
  value: string;
};

type MenuResponse = {
  menuItem?: ApiMenuItem | ApiMenuItem[];
};

type VehicleResponse = {
  id: string;
  year: string | number;
  make: string;
  model: string;
  city08: string | number;
  highway08: string | number;
  comb08: string | number;
};

export type VehicleOption = {
  label: string;
  value: string;
};

export type VehicleDetails = {
  id: string;
  year: number;
  make: string;
  model: string;
  cityMpg: number;
  highwayMpg: number;
  combinedMpg: number;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Fuel economy request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

function normalizeMenu(response: MenuResponse): VehicleOption[] {
  if (!response.menuItem) {
    return [];
  }

  const items = Array.isArray(response.menuItem)
    ? response.menuItem
    : [response.menuItem];

  return items.map((item) => ({
    label: item.text,
    value: item.value,
  }));
}

function query(params: Record<string, string>) {
  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
}

export async function getVehicleYears() {
  return normalizeMenu(
    await request<MenuResponse>("/vehicle/menu/year"),
  );
}

export async function getVehicleMakes(year: string) {
  return normalizeMenu(
    await request<MenuResponse>(
      `/vehicle/menu/make?${query({ year })}`,
    ),
  );
}

export async function getVehicleModels(year: string, make: string) {
  return normalizeMenu(
    await request<MenuResponse>(
      `/vehicle/menu/model?${query({ year, make })}`,
    ),
  );
}

export async function getVehicleOptions(
  year: string,
  make: string,
  model: string,
) {
  return normalizeMenu(
    await request<MenuResponse>(
      `/vehicle/menu/options?${query({ year, make, model })}`,
    ),
  );
}

export async function getVehicleDetails(
  vehicleId: string,
): Promise<VehicleDetails> {
  const vehicle = await request<VehicleResponse>(
    `/vehicle/${encodeURIComponent(vehicleId)}`,
  );

  return {
    id: String(vehicle.id),
    year: Number(vehicle.year),
    make: vehicle.make,
    model: vehicle.model,
    cityMpg: Number(vehicle.city08),
    highwayMpg: Number(vehicle.highway08),
    combinedMpg: Number(vehicle.comb08),
  };
}
