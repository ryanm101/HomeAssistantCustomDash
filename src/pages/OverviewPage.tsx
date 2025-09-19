export default function OverviewPage() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card title="Welcome">Overview ready.</Card>
      <Card title="Entities">Connect HA in next task.</Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-2xl border p-4 shadow">
      <div className="mb-2 text-lg opacity-70">{title}</div>
      <div className="text-xl">{children}</div>
    </div>
  );
}

