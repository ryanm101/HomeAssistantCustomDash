import { useState } from "react";
import { useEntity } from "../hooks/useEntity";
import { useServiceCall } from "../hooks/useServiceCall";
import { Placeholder, Tile } from "./Tile";

interface EntityTileProps {
  entityId: string;
  title?: string;
  domain?: string;
}

export function EntityTile({ entityId, title, domain }: EntityTileProps) {
  const entity = useEntity(entityId);
  const serviceCall = useServiceCall();
  const [pending, setPending] = useState(false);

  if (!entity) {
    return <Tile title={title ?? entityId}><Placeholder message="Entity unavailable" /></Tile>;
  }

  const friendlyName = title ?? (entity.attributes?.friendly_name as string | undefined) ?? entityId;
  const stateLabel = formatState(entity.state);
  const isOn = entity.state === "on" || entity.state === "open" || entity.state === "playing";

  async function toggle() {
    if (pending) {
      return;
    }
    setPending(true);
    const nextState = isOn ? "off" : "on";
    try {
      await serviceCall(
        {
          domain: domain ?? entity.entity_id.split(".")[0],
          service: isOn ? "turn_off" : "turn_on",
          serviceData: { entity_id: entity.entity_id },
        },
        {
          optimisticEntities: {
            [entity.entity_id]: { ...entity, state: nextState },
          },
        },
      );
    } catch (error) {
      console.error("Failed to toggle entity", error);
    } finally {
      setPending(false);
    }
  }

  return (
    <Tile
      title={friendlyName}
      subtitle={entity.entity_id}
      actions={
        <button
          onClick={toggle}
          disabled={pending}
          className={`rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
            isOn ? "bg-cyan-500 text-slate-900" : "bg-slate-800/70 text-slate-200"
          } ${pending ? "opacity-70" : "hover:bg-cyan-400 hover:text-slate-900"}`}
        >
          {pending ? "…" : isOn ? "Turn Off" : "Turn On"}
        </button>
      }
    >
      <div className="flex h-full flex-col justify-end">
        <span className="text-4xl font-semibold tracking-tight">{stateLabel}</span>
        <span className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-400">Current State</span>
      </div>
    </Tile>
  );
}

function formatState(state: string) {
  return state.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
