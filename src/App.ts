// src/App.tsx (sketch)
import { useEffect, useState } from "react";
import { connectHA } from "./ha";

export default function App() {
  const [ha, setHa] = useState<any>(null);
  const [e, setE] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      const client = await connectHA(import.meta.env.VITE_HA_URL, import.meta.env.VITE_HA_TOKEN);
      setHa(client);
      client.subscribe(setE);
    })();
  }, []);

  if (!e || !ha) return <div className="p-6 text-2xl">Connecting…</div>;

  // Examples:
  const solar = e["sensor.solar_power"]?.state;
  const gridImport = e["sensor.grid_import_power"]?.state;
  const battery = e["sensor.battery_soc"]?.state;
  const climateId = "climate.downstairs";
  const washingState = e["sensor.miele_washer_state"]?.state;
  const roboId = "vacuum.roborock_s7";

  return (
    <div className="p-4 grid grid-cols-2 gap-4 text-xl select-none">
      {/* Solar / Battery / Grid */}
      <Tile title="Solar (W)" value={solar}/>
      <Tile title="Grid (W)" value={gridImport}/>
      <Tile title="Battery (%)" value={battery}/>

      {/* Heating */}
      <div className="col-span-2 p-4 rounded-2xl shadow">
        <h2 className="text-2xl mb-2">Heating</h2>
        <button className="btn" onClick={() => ha.call("climate","set_temperature",{ entity_id: climateId, temperature: 20 })}>20°</button>
        <button className="btn" onClick={() => ha.call("climate","set_temperature",{ entity_id: climateId, temperature: 21.5 })}>21.5°</button>
        <button className="btn" onClick={() => ha.call("climate","set_hvac_mode",{ entity_id: climateId, hvac_mode: "heat"})}>Heat</button>
        <button className="btn" onClick={() => ha.call("climate","set_hvac_mode",{ entity_id: climateId, hvac_mode: "off"})}>Off</button>
      </div>

      {/* Washing machine state */}
      <Tile title="Washer" value={washingState}/>
      {/* Roborock */}
      <div className="p-4 rounded-2xl shadow">
        <h2 className="text-2xl mb-2">Roborock</h2>
        <button className="btn" onClick={() => ha.call("vacuum","start",{ entity_id: roboId })}>Start</button>
        <button className="btn" onClick={() => ha.call("vacuum","pause",{ entity_id: roboId })}>Pause</button>
        <button className="btn" onClick={() => ha.call("vacuum","return_to_base",{ entity_id: roboId })}>Dock</button>
      </div>
    </div>
  );
}

function Tile({title, value}:{title:string; value:any}) {
  return (
    <div className="p-6 rounded-2xl shadow flex flex-col items-center justify-center">
      <div className="text-lg opacity-70">{title}</div>
      <div className="text-4xl font-bold">{value ?? "—"}</div>
    </div>
  );
}

