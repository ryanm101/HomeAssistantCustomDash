import { EnergyFlowCard } from "../widgets/EnergyFlowCard";
import { EnergyNowCard } from "../widgets/EnergyNowCard";
import { CapacityCard } from "../widgets/CapacityCard";

export default function SolarPage() {
  return (
    <div className="grid min-h-full grid-cols-2 gap-1 auto-rows-[minmax(160px,1fr)]">
      <div className="col-span-1 row-span-1 min-h-[320px]">
              <EnergyFlowCard />
            </div>
            <div className="col-span-1 row-span-1 min-h-[320px]">
              <CapacityCard />
            </div>
    </div>
  );
}
