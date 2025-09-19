import { useState } from "react";
import { useEntity } from "../hooks/useEntity";
import { useServiceCall } from "../hooks/useServiceCall";
import { Placeholder, Tile } from "./Tile";

interface MediaTileProps {
  entityId: string;
}

export function MediaTile({ entityId }: MediaTileProps) {
  const entity = useEntity(entityId);
  const serviceCall = useServiceCall();
  const [pending, setPending] = useState(false);

  if (!entity) {
    return <Tile title="Media" subtitle={entityId}><Placeholder message="Media player unavailable" /></Tile>;
  }

  const friendlyName = entity.attributes?.friendly_name ?? "Media";
  const mediaTitle = entity.attributes?.media_title ?? "Idle";
  const mediaArtist = entity.attributes?.media_artist ?? entity.attributes?.media_series_title ?? "";
  const isPlaying = entity.state === "playing";
  const volume = Math.round((entity.attributes?.volume_level ?? 0) * 100);

  async function togglePlayback() {
    if (pending) {
      return;
    }
    setPending(true);
    const targetState = isPlaying ? "paused" : "playing";
    try {
      await serviceCall(
        {
          domain: "media_player",
          service: isPlaying ? "media_pause" : "media_play",
          serviceData: { entity_id: entity.entity_id },
        },
        {
          optimisticEntities: {
            [entity.entity_id]: { ...entity, state: targetState },
          },
        },
      );
    } catch (error) {
      console.error("Failed to toggle media playback", error);
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
          onClick={togglePlayback}
          disabled={pending}
          className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wider transition ${
            isPlaying ? "bg-emerald-400 text-slate-900" : "bg-slate-800/70 text-slate-100"
          }`}
        >
          {pending ? "…" : isPlaying ? "Pause" : "Play"}
        </button>
      }
    >
      <div className="flex h-full flex-col justify-end gap-4">
        <div>
          <p className="text-xl font-medium text-slate-100">{mediaTitle}</p>
          <p className="text-sm text-slate-400">{mediaArtist}</p>
        </div>
        <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Volume {volume}%</div>
      </div>
    </Tile>
  );
}
