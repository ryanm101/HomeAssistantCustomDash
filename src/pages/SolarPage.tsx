import { EnergyFlowCard } from "../widgets/EnergyFlowCard";
import { Tile } from "../widgets/Tile";

export default function SolarPage() {
  return (
    <div className="grid gap-4">
      <EnergyFlowCard />
      <Tile title="Tips" subtitle="Fine tune your solar dashboard">
        <ul className="text-sm text-slate-300/90">
          <li className="mb-1">Confirm your Home Assistant sensors are exposed as watts for accurate flow rendering.</li>
          <li className="mb-1">Battery state is read from <code>sensor.solaredge_b1_state_of_energy</code>; update Settings if you use a different sensor.</li>
          <li>Use the Settings page to keep the kiosk awake and fullscreen on your wall-mounted display.</li>
        </ul>
      </Tile>
    </div>
  );
}
