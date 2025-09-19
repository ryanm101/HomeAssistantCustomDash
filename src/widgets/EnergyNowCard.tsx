import { useEntity } from "../hooks/useEntity";
import { Placeholder, Tile } from "./Tile";

interface EnergyNowCardProps {
  consumptionId: string;
  productionId?: string;
}

export function EnergyNowCard({ consumptionId, productionId }: EnergyNowCardProps) {
  const consumption = useEntity(consumptionId);
  const production = productionId ? useEntity(productionId) : undefined;

  if (!consumption) {
    return <Tile title="Energy" subtitle={consumptionId}><Placeholder message="Energy sensor unavailable" /></Tile>;
  }

  const consumptionValue = toNumber(consumption.state);
  const productionValue = production ? toNumber(production.state) : 0;
  const unit = consumption.attributes?.unit_of_measurement ?? "W";
  const net = consumptionValue - productionValue;

  return (
    <Tile
      title="Energy Snapshot"
      subtitle={`${consumptionValue.toFixed(0)}${unit} drawn${production ? ` / ${productionValue.toFixed(0)}${unit} generated` : ""}`}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-semibold tracking-tight">{net.toFixed(0)}</span>
          <span className="text-2xl uppercase tracking-widest text-slate-400">{unit}</span>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-xs uppercase tracking-wider text-slate-300/80">
          <div>
            <dt className="text-slate-400">Consumption</dt>
            <dd className="text-lg text-slate-100">{consumptionValue.toFixed(0)} {unit}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Production</dt>
            <dd className="text-lg text-slate-100">{production ? `${productionValue.toFixed(0)} ${unit}` : "0"}</dd>
          </div>
        </dl>
      </div>
    </Tile>
  );
}

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}
