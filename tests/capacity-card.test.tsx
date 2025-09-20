/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { CapacityCard } from "../src/widgets/CapacityCard";
import { resetEntitiesStore, setEntities } from "../src/store/entitiesStore";

describe("CapacityCard", () => {
  beforeEach(() => {
    resetEntitiesStore();
  });

  it("shows placeholder when data is missing", () => {
    render(<CapacityCard />);
    expect(screen.getByText(/awaiting home assistant data/i)).toBeInTheDocument();
  });

  it("calculates available headroom", () => {
    setEntities({
      "sensor.solar_panel_to_house_w": { entity_id: "sensor.solar_panel_to_house_w", state: "500", attributes: {} },
      "sensor.solar_panel_to_grid_w": { entity_id: "sensor.solar_panel_to_grid_w", state: "3100", attributes: {} },
      "sensor.solar_panel_to_battery_w": { entity_id: "sensor.solar_panel_to_battery_w", state: "1400", attributes: {} },
      "sensor.solar_grid_to_house_w": { entity_id: "sensor.solar_grid_to_house_w", state: "0", attributes: {} },
      "sensor.solar_battery_to_house_w": { entity_id: "sensor.solar_battery_to_house_w", state: "0", attributes: {} },
      "sensor.solaredge_b1_state_of_energy": { entity_id: "sensor.solaredge_b1_state_of_energy", state: "42", attributes: {} },
    } as any);

    render(<CapacityCard />);

    expect(screen.getAllByText(/3.1 kW/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5.0 kW/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/500 W/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1.4 kW/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/42%/i).length).toBeGreaterThan(0);
  });
});
