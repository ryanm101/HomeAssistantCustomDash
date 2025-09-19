/* @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { toHaveNoViolations } from "vitest-axe/matchers";
import React from "react";

import AppShell from "../src/app/AppShell";
import { resetEntitiesStore } from "../src/store/entitiesStore";

expect.extend({ toHaveNoViolations });

describe("App accessibility", () => {
  it("renders AppShell without axe violations", async () => {
    resetEntitiesStore();
    const { container } = render(
      <MemoryRouter initialEntries={["/overview"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/overview" element={<div>Overview</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
