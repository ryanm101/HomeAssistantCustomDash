/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { EnergyFlowCard } from "../src/widgets/EnergyFlowCard";
import { resetEntitiesStore, setEntities } from "../src/store/entitiesStore";

describe("EnergyFlowCard", () => {
  beforeEach(() => {
    resetEntitiesStore();
  });

  it("shows placeholder when no data is available", () => {
    render(<EnergyFlowCard />);
    expect(screen.getByText(/awaiting home assistant data/i)).toBeInTheDocument();
  });

  it("renders live flow values when entities exist", () => {
    setEntities({
      "sensor.solar_panel_to_house_w": { entity_id: "sensor.solar_panel_to_house_w", state: "1800", attributes: {} },
      "sensor.solar_panel_to_grid_w": { entity_id: "sensor.solar_panel_to_grid_w", state: "400", attributes: {} },
      "sensor.solar_panel_to_battery_w": { entity_id: "sensor.solar_panel_to_battery_w", state: "600", attributes: {} },
      "sensor.solar_grid_to_house_w": { entity_id: "sensor.solar_grid_to_house_w", state: "120", attributes: {} },
      "sensor.solar_battery_to_house_w": { entity_id: "sensor.solar_battery_to_house_w", state: "300", attributes: {} },
      "sensor.solar_grid_to_battery_w": { entity_id: "sensor.solar_grid_to_battery_w", state: "50", attributes: {} },
      "sensor.solaredge_b1_state_of_energy": { entity_id: "sensor.solaredge_b1_state_of_energy", state: "78", attributes: {} },
    } as any);

    render(<EnergyFlowCard />);

    expect(screen.getAllByText(/home energy flow/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Solar 2\.8 kW/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/78%/i).length).toBeGreaterThan(0);
  });
});
