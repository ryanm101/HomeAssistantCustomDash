/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import {
  setEntities,
  resetEntitiesStore,
  applyOptimisticEntities,
  getEntitiesSnapshot,
} from "../src/store/entitiesStore";
import { EntityTile } from "../src/widgets/EntityTile";
import { ClimateCard } from "../src/widgets/ClimateCard";
import { SecurityTile } from "../src/widgets/SecurityTile";

const serviceCallMock = vi.fn();

vi.mock("../src/hooks/useServiceCall", () => ({
  useServiceCall: () => serviceCallMock,
}));

describe("widgets", () => {
  beforeEach(() => {
    cleanup();
    serviceCallMock.mockReset();
    serviceCallMock.mockImplementation(async (_descriptor, options) => {
      if (options?.optimisticEntities) {
        applyOptimisticEntities(options.optimisticEntities);
      }
    });
    resetEntitiesStore();
  });

  afterEach(() => {
    cleanup();
  });

  it("toggles entities optimistically", async () => {
    setEntities({
      "light.test": {
        entity_id: "light.test",
        state: "off",
        attributes: { friendly_name: "Test Light" },
      },
    } as any);
    render(<EntityTile entityId="light.test" />);

    const button = screen.getByRole("button", { name: /turn on/i });
    await userEvent.click(button);

    expect(serviceCallMock).toHaveBeenCalledWith(
      expect.objectContaining({ service: "turn_on" }),
      expect.any(Object),
    );
    await screen.findByText(/On/i);
  });

  it("adjusts climate setpoints", async () => {
    setEntities({
      "climate.home": {
        entity_id: "climate.home",
        state: "heat",
        attributes: {
          friendly_name: "Home Thermostat",
          temperature: 21,
          current_temperature: 20,
          hvac_action: "heating",
          unit_of_measurement: "°C",
        },
      },
    } as any);
    render(<ClimateCard entityId="climate.home" />);
    const increase = screen.getByLabelText(/increase temperature/i);
    await userEvent.click(increase);

    expect(serviceCallMock).toHaveBeenCalledWith(
      expect.objectContaining({ service: "set_temperature" }),
      expect.any(Object),
    );
    const snapshot = getEntitiesSnapshot();
    expect(snapshot["climate.home"].attributes.temperature).toBe(21.5);
    expect(await screen.findByText(/21.5/)).toBeInTheDocument();
  });

  it("updates security state buttons", async () => {
    setEntities({
      "alarm_control_panel.house": {
        entity_id: "alarm_control_panel.house",
        state: "disarmed",
        attributes: { last_triggered: null },
      },
    } as any);
    render(<SecurityTile entityId="alarm_control_panel.house" />);
    await userEvent.click(screen.getByRole("button", { name: /arm home/i }));

    expect(serviceCallMock).toHaveBeenCalledWith(
      expect.objectContaining({ service: "alarm_arm_home" }),
      expect.any(Object),
    );
  });
});
