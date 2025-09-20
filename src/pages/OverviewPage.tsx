import { useHAConnection } from "../hooks/useHAConnection";
import { ClimateCard } from "../widgets/ClimateCard";
import { EnergyFlowCard } from "../widgets/EnergyFlowCard";
import { EnergyNowCard } from "../widgets/EnergyNowCard";
import { CapacityCard } from "../widgets/CapacityCard";
import { EntityTile } from "../widgets/EntityTile";
import { MediaTile } from "../widgets/MediaTile";
import { SecurityTile } from "../widgets/SecurityTile";
import { SensorTile } from "../widgets/SensorTile";
import { Placeholder, Tile } from "../widgets/Tile";

const DEFAULT_ENTITIES = {
  climate: "climate.living_room",
  livingRoomLight: "light.living_room",
  hallwayLight: "switch.hallway",
  mediaPlayer: "media_player.family_room",
  alarm: "alarm_control_panel.home_alarm",
  energyConsumption: "sensor.house_consumption",
  energyProduction: "sensor.solar_output",
  temperature: "sensor.outdoor_temperature",
};

export default function OverviewPage() {
  const { status, credentials } = useHAConnection();
  const isConfigured = Boolean(credentials);

  if (!isConfigured) {
    return (
      <div className="grid gap-4">
        <Tile title="Welcome to rpidash" subtitle="Connect Home Assistant">
          <Placeholder message="Open Settings to add your Home Assistant URL and long-lived access token." />
        </Tile>
      </div>
    );
  }

  return (
    <div className="grid min-h-full grid-cols-12 gap-4 auto-rows-[minmax(160px,1fr)]">
      <div className="col-span-6 row-span-2 min-h-[320px]">
        <EnergyFlowCard />
      </div>
      <div className="col-span-6 row-span-2 min-h-[320px]">
        <CapacityCard />
      </div>
      <div className="col-span-4 row-span-2 min-h-[280px]">
        <ClimateCard entityId={DEFAULT_ENTITIES.climate} />
      </div>
      <div className="col-span-4 row-span-2 min-h-[280px]">
        <EnergyNowCard
          consumptionId={DEFAULT_ENTITIES.energyConsumption}
          productionId={DEFAULT_ENTITIES.energyProduction}
        />
      </div>
      <div className="col-span-4 row-span-1">
        <SensorTile entityId={DEFAULT_ENTITIES.temperature} label="Outdoor" />
      </div>
      <div className="col-span-4 row-span-1">
        <SecurityTile entityId={DEFAULT_ENTITIES.alarm} />
      </div>
      <div className="col-span-4 row-span-2 min-h-[280px]">
        <MediaTile entityId={DEFAULT_ENTITIES.mediaPlayer} />
      </div>
      <div className="col-span-4 row-span-1">
        <EntityTile entityId={DEFAULT_ENTITIES.livingRoomLight} title="Living Room" />
      </div>
      <div className="col-span-4 row-span-1">
        <EntityTile entityId={DEFAULT_ENTITIES.hallwayLight} title="Hallway" />
      </div>
      <div className="col-span-4 row-span-1">
        <Tile title="Connection" subtitle={status.phase.toUpperCase()}>
          <Placeholder
            message={`Last update ${status.lastUpdateTs ? new Date(status.lastUpdateTs).toLocaleTimeString() : "—"}`}
          />
        </Tile>
      </div>
    </div>
  );
}
