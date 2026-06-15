# PerMile 🚗🚙🚓 ⛽

PerMile is a mobile app that estimates the fuel cost of a trip based on vehicle fuel efficiency, distance, and local gas prices.

The project is being developed as a practical way to learn React Native, TypeScript, SQL, API integration, and mobile app deployment.

## Project Status

PerMile is currently in early development and is not yet available on the Google Play Store.

## Planned Features

- Calculate estimated fuel cost per mile
- Calculate total fuel cost for a trip
- Select a vehicle by year, make, model, and configuration
- Automatically retrieve EPA fuel-efficiency data
- Save frequently used vehicles
- Store previous calculations
- Support manual MPG entry
- Handle loading, offline, and API error states

## Tech

- React Native
- Expo
- TypeScript
- SQLite
- FuelEconomy.gov Web Services

## Project Goals

The primary goals of PerMile are to:

- Build and publish a complete mobile application
- Practice component-based interface design
- Integrate an external REST API
- Design and query a local SQL database
- Learn mobile testing and deployment
- Create a polished portfolio project

## Planned User Flow

1. Select or enter a vehicle.
2. Enter the trip distance and current gas price.
3. Review the estimated fuel usage and trip cost.
4. Optionally save the vehicle and calculation.

## Roadmap

- [x] Create the initial trip-cost calculator
- [x] Add EPA vehicle selection
- [ ] Add SQLite persistence
- [ ] Save calculation history
- [ ] Improve accessibility and visual design
- [ ] Add automated tests
- [ ] Prepare the Google Play Store release

## Data Source

Vehicle fuel-efficiency information is provided by the
[FuelEconomy.gov Web Services](https://www.fueleconomy.gov/feg/ws/index.shtml).

Fuel-cost results are estimates and may differ from real-world costs due to
driving conditions, vehicle condition, fuel prices, and driving behavior.

## License

This project is currently intended for educational and portfolio purposes.
