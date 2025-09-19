/* @vitest-environment jsdom */
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import {
  setEntities,
  updateEntity,
  getEntitiesSnapshot,
  applyOptimisticEntities,
  resetEntitiesStore,
} from "../src/store/entitiesStore";
import { useEntity } from "../src/hooks/useEntity";

const kitchenLight = {
  entity_id: "light.kitchen",
  state: "off",
  attributes: {},
} as any;

const deskLamp = {
  entity_id: "switch.desk",
  state: "off",
  attributes: {},
} as any;

describe("entitiesStore", () => {
  beforeEach(() => {
    resetEntitiesStore();
    setEntities({
      [kitchenLight.entity_id]: kitchenLight,
      [deskLamp.entity_id]: deskLamp,
    } as any);
  });

  it("only re-renders when the tracked entity changes", async () => {
    const renders: string[] = [];

    function Tracker() {
      const entity = useEntity("light.kitchen");
      renders.push(entity?.state ?? "none");
      return <div data-testid="state">{entity?.state}</div>;
    }

    render(<Tracker />);
    expect(screen.getByTestId("state").textContent).toBe("off");
    expect(renders).toEqual(["off"]);

    updateEntity("switch.desk", { ...deskLamp, state: "on" });
    expect(renders).toEqual(["off"]);

    updateEntity("light.kitchen", { ...kitchenLight, state: "on" });
    await waitFor(() => expect(renders).toEqual(["off", "on"]));
    expect(screen.getByTestId("state").textContent).toBe("on");
  });

  it("applies optimistic updates and rolls back on failure", () => {
    const rollback = applyOptimisticEntities({
      "light.kitchen": { ...kitchenLight, state: "on" },
    });

    expect(getEntitiesSnapshot()["light.kitchen"].state).toBe("on");

    rollback();
    expect(getEntitiesSnapshot()["light.kitchen"].state).toBe("off");

    const keep = applyOptimisticEntities({
      "light.kitchen": { ...kitchenLight, state: "on" },
    });
    setEntities({
      "light.kitchen": { ...kitchenLight, state: "on" },
    } as any);
    keep();
    expect(getEntitiesSnapshot()["light.kitchen"].state).toBe("on");
  });
});
