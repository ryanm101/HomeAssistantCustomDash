import { useState } from "react";
import { useEntity } from "../hooks/useEntity";
import { useServiceCall } from "../hooks/useServiceCall";
import { Placeholder, Tile } from "./Tile";

interface SecurityTileProps {
  entityId: string;
}

const ACTIONS = [
  { label: "Disarm", service: "alarm_disarm", nextState: "disarmed" },
  { label: "Arm Home", service: "alarm_arm_home", nextState: "armed_home" },
  { label: "Arm Away", service: "alarm_arm_away", nextState: "armed_away" },
];

export function SecurityTile({ entityId }: SecurityTileProps) {
  const entity = useEntity(entityId);
  const serviceCall = useServiceCall();
  const [pendingState, setPendingState] = useState<string | null>(null);

  if (!entity) {
    return <Tile title="Security" subtitle={entityId}><Placeholder message="Alarm panel unavailable" /></Tile>;
  }

  async function runAction(action: (typeof ACTIONS)[number]) {
    if (pendingState) {
      return;
    }
    setPendingState(action.nextState);
    try {
      await serviceCall(
        {
          domain: "alarm_control_panel",
          service: action.service,
          serviceData: { entity_id: entity.entity_id },
        },
        {
          optimisticEntities: {
            [entity.entity_id]: { ...entity, state: action.nextState },
          },
        },
      );
    } catch (error) {
      console.error("Failed to update alarm state", error);
    } finally {
      setPendingState(null);
    }
  }

  const status = formatState(entity.state);
  const lastTriggered = entity.attributes?.last_triggered ? new Date(entity.attributes.last_triggered).toLocaleString() : "—";

  return (
    <Tile title="Security" subtitle={entity.entity_id}>
      <div className="flex h-full flex-col justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Status</p>
          <p className="text-4xl font-semibold">{status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <button
              key={action.service}
              onClick={() => runAction(action)}
              disabled={pendingState !== null}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                entity.state === action.nextState ? "bg-amber-400 text-slate-900" : "bg-slate-800/70 text-slate-200"
              }`}
            >
              {pendingState === action.nextState ? "…" : action.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-400">Last triggered: {lastTriggered}</div>
      </div>
    </Tile>
  );
}

function formatState(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
