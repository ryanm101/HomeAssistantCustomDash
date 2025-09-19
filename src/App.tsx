import { useEffect, useState } from "react";
import { connectHA } from "./ha";

export default function App() {
  const [e, setE] = useState<Record<string, any>>({});
  const [ha, setHa] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { VITE_HA_URL, VITE_HA_TOKEN } = import.meta.env;
      const client = await connectHA(VITE_HA_URL, VITE_HA_TOKEN);
      setHa(client);
      client.subscribe(setE);
    })();
  }, []);

  if (!ha) return <div className="p-6 text-2xl">Connecting…</div>;

  return (
    <div className="p-4 grid grid-cols-2 gap-4 text-xl">
      <Tile title="Solar" value={e["sensor.solar_power"]?.state} />
      <Tile title="Grid" value={e["sensor.grid_import_power"]?.state} />
    </div>
  );
}

function Tile({ title, value }: { title: string; value: any }) {
  return (
    <div className="p-6 rounded-2xl shadow flex flex-col items-center justify-center">
      <div className="text-lg opacity-70">{title}</div>
      <div className="text-4xl font-bold">{value ?? "—"}</div>
    </div>
  );
}

