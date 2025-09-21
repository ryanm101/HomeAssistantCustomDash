/* @vitest-environment jsdom */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import VacuumPage from "../src/pages/VacuumPage";
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

describe("VacuumPage", () => {
  beforeEach(() => {
    cleanup();
    resetEntitiesStore();
    mocks.serviceCallMock.mockReset();
    mocks.serviceCallMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("prompts for Home Assistant credentials when not configured", () => {
    mocks.useHAConnectionMock.mockReturnValue(buildConnectionMock(null));

    render(<VacuumPage />);

    expect(screen.getByText(/open settings/i)).toBeInTheDocument();
  });

  it("renders vacuum controls and status details", async () => {
    mocks.useHAConnectionMock.mockReturnValue(buildConnectionMock({ url: "https://ha.local", token: "abc" }));

    setEntities({
      "vacuum.robot_vacuum": {
        entity_id: "vacuum.robot_vacuum",
        state: "idle",
        attributes: {
          friendly_name: "Robot Vacuum",
          battery_level: 72,
          cleaning_mode: "turbo",
        },
      },
      "sensor.robot_vacuum_battery": {
        entity_id: "sensor.robot_vacuum_battery",
        state: "68",
        attributes: { unit_of_measurement: "%" },
      },
      "sensor.robot_vacuum_status": {
        entity_id: "sensor.robot_vacuum_status",
        state: "docked",
      },
      "sensor.robot_vacuum_cleaning_mode": {
        entity_id: "sensor.robot_vacuum_cleaning_mode",
        state: "quiet",
      },
      "sensor.robot_vacuum_current_room": {
        entity_id: "sensor.robot_vacuum_current_room",
        state: "living_room",
      },
      "binary_sensor.robot_vacuum_error": {
        entity_id: "binary_sensor.robot_vacuum_error",
        state: "off",
      },
      "binary_sensor.robot_vacuum_bin_full": {
        entity_id: "binary_sensor.robot_vacuum_bin_full",
        state: "off",
      },
      "sensor.robot_vacuum_brush_minutes": {
        entity_id: "sensor.robot_vacuum_brush_minutes",
        state: "120",
        attributes: { unit_of_measurement: "min" },
      },
      "sensor.robot_vacuum_filter_minutes": {
        entity_id: "sensor.robot_vacuum_filter_minutes",
        state: "45",
        attributes: { unit_of_measurement: "min" },
      },
    } as any);

    render(<VacuumPage />);

    expect(screen.getByText(/controls/i)).toBeInTheDocument();
    expect(screen.getByText(/maintenance/i)).toBeInTheDocument();

    const stateBlock = screen.getByText(/^State$/i).closest("div");
    expect(stateBlock).not.toBeNull();
    expect(within(stateBlock as HTMLElement).getByText(/Idle/i)).toBeInTheDocument();

    const batteryRow = screen.getByTestId("entity-row-sensor.robot_vacuum_battery");
    expect(within(batteryRow).getByText(/^Battery$/i)).toBeInTheDocument();
    expect(within(batteryRow).getByText(/68 %/i)).toBeInTheDocument();

    const startButton = screen.getByRole("button", { name: /start cleaning/i });
    await userEvent.click(startButton);

    expect(mocks.serviceCallMock).toHaveBeenCalledWith({
      domain: "vacuum",
      service: "start",
      serviceData: { entity_id: "vacuum.robot_vacuum" },
    });
  });

  it("switches control labels for cleaning and paused states", async () => {
    mocks.useHAConnectionMock.mockReturnValue(buildConnectionMock({ url: "https://ha.local", token: "abc" }));

    setEntities({
      "vacuum.robot_vacuum": {
        entity_id: "vacuum.robot_vacuum",
        state: "cleaning",
      },
    } as any);

    const view = render(<VacuumPage />);

    const pauseButton = view.getByRole("button", { name: /pause cleaning/i });
    await userEvent.click(pauseButton);

    expect(mocks.serviceCallMock).toHaveBeenCalledWith({
      domain: "vacuum",
      service: "pause",
      serviceData: { entity_id: "vacuum.robot_vacuum" },
    });

    mocks.serviceCallMock.mockClear();
    resetEntitiesStore();
    setEntities({
      "vacuum.robot_vacuum": {
        entity_id: "vacuum.robot_vacuum",
        state: "paused",
      },
    } as any);

    view.rerender(<VacuumPage />);

    const resumeButton = view.getByRole("button", { name: /resume cleaning/i });
    await userEvent.click(resumeButton);

    expect(mocks.serviceCallMock).toHaveBeenCalledWith({
      domain: "vacuum",
      service: "start",
      serviceData: { entity_id: "vacuum.robot_vacuum" },
    });
  });
});
