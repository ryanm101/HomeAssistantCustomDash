/* @vitest-environment jsdom */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import WashingMachinePage from "../src/pages/WashingMachinePage";
import { resetEntitiesStore, setEntities } from "../src/store/entitiesStore";

const mocks = vi.hoisted(() => ({
  useHAConnectionMock: vi.fn(),
  serviceCallMock: vi.fn(),
}));

vi.mock("../src/hooks/useHAConnection", () => ({
  useHAConnection: mocks.useHAConnectionMock,
}));

vi.mock("../src/hooks/useServiceCall", () => ({
  useServiceCall: () => mocks.serviceCallMock,
}));

function buildConnectionMock(credentials: object | null) {
  return {
    status: { phase: credentials ? "connected" : "disconnected", lastUpdateTs: null, attempts: 0 },
    credentials,
    isConnected: Boolean(credentials),
    isReconnecting: false,
    actions: {
      setCredentials: vi.fn(),
      clearCredentials: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
    },
  };
}

describe("WashingMachinePage", () => {
  beforeEach(() => {
    cleanup();
    resetEntitiesStore();
    mocks.serviceCallMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("prompts for Home Assistant credentials when not configured", () => {
    mocks.useHAConnectionMock.mockReturnValue(buildConnectionMock(null));

    render(<WashingMachinePage />);

    expect(screen.getByText(/open settings/i)).toBeInTheDocument();
  });

  it("renders entities and handles interactions", async () => {
    mocks.useHAConnectionMock.mockReturnValue(buildConnectionMock({ url: "https://ha.local", token: "abc" }));

    setEntities({
      "switch.washing_machine_power_on": {
        entity_id: "switch.washing_machine_power_on",
        state: "off",
        attributes: { friendly_name: "Power on" },
      },
      "button.washing_machine_start": {
        entity_id: "button.washing_machine_start",
        state: "unknown",
        attributes: { friendly_name: "Start" },
      },
      "button.washing_machine_stop": {
        entity_id: "button.washing_machine_stop",
        state: "unknown",
        attributes: { friendly_name: "Stop" },
      },
      "binary_sensor.washing_machine_door": {
        entity_id: "binary_sensor.washing_machine_door",
        state: "off",
        attributes: { friendly_name: "Door" },
      },
      "sensor.washing_machine_program": {
        entity_id: "sensor.washing_machine_program",
        state: "cottons",
        attributes: { friendly_name: "Program" },
      },
      "sensor.washing_machine_program_phase": {
        entity_id: "sensor.washing_machine_program_phase",
        state: "washing",
        attributes: { friendly_name: "Phase" },
      },
      "sensor.washing_machine_status": {
        entity_id: "sensor.washing_machine_status",
        state: "running",
        attributes: { friendly_name: "Status" },
      },
      "sensor.washing_machine_energy_consumption": {
        entity_id: "sensor.washing_machine_energy_consumption",
        state: "1.2",
        attributes: { unit_of_measurement: "kWh" },
      },
      "sensor.washing_machine_energy_forecast": {
        entity_id: "sensor.washing_machine_energy_forecast",
        state: "1.5",
        attributes: { unit_of_measurement: "kWh" },
      },
      "sensor.washing_machine_elapsed_time": {
        entity_id: "sensor.washing_machine_elapsed_time",
        state: "00:30:00",
      },
      "binary_sensor.washing_machine_failure": {
        entity_id: "binary_sensor.washing_machine_failure",
        state: "off",
      },
      "sensor.washing_machine_finish_at": {
        entity_id: "sensor.washing_machine_finish_at",
        state: new Date().toISOString(),
      },
      "binary_sensor.washing_machine_remote_control": {
        entity_id: "binary_sensor.washing_machine_remote_control",
        state: "on",
      },
      "sensor.washing_machine_spin_speed": {
        entity_id: "sensor.washing_machine_spin_speed",
        state: "1200",
        attributes: { unit_of_measurement: "rpm" },
      },
      "sensor.washing_machine_start_time": {
        entity_id: "sensor.washing_machine_start_time",
        state: "08:30",
      },
      "sensor.washing_machine_target_temperature": {
        entity_id: "sensor.washing_machine_target_temperature",
        state: "40",
        attributes: { unit_of_measurement: "°C" },
      },
    } as any);

    render(<WashingMachinePage />);

    const powerRow = screen.getByTestId("entity-row-switch.washing_machine_power_on");
    expect(within(powerRow).getByText(/power on/i)).toBeInTheDocument();
    expect(within(powerRow).getByText(/off/i)).toBeInTheDocument();

    const toggleButton = within(powerRow).getByRole("button", { name: /turn on/i });
    await userEvent.click(toggleButton);

    expect(mocks.serviceCallMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        domain: "switch",
        service: "turn_on",
        serviceData: { entity_id: "switch.washing_machine_power_on" },
      }),
      expect.objectContaining({ optimisticEntities: expect.any(Object) }),
    );

    const startRow = screen.getByTestId("entity-row-button.washing_machine_start");
    const pressButton = within(startRow).getByRole("button", { name: /press/i });
    await userEvent.click(pressButton);

    expect(mocks.serviceCallMock).toHaveBeenNthCalledWith(2, {
      domain: "button",
      service: "press",
      serviceData: { entity_id: "button.washing_machine_start" },
    });

    const statusRow = screen.getByTestId("entity-row-sensor.washing_machine_status");
    expect(within(statusRow).getByText(/^Status$/i)).toBeInTheDocument();
    expect(within(statusRow).getByText(/running/i)).toBeInTheDocument();
  });
});
