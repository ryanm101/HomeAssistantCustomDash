export default function Footer() {
  return (
    <div className="flex h-6 items-center gap-3 border-t px-2 text-xs opacity-80">
      <StatusDot status="disconnected" />
      <div>HA — ms</div>
      <div>Updated —</div>
      <div className="ml-auto">Profile: Default</div>
    </div>
  );
}

function StatusDot({ status }: { status: "connected" | "reconnecting" | "disconnected" }) {
  const color = status === "connected" ? "bg-green-500" : status === "reconnecting" ? "bg-yellow-500" : "bg-red-500";
  return <span aria-label={`status-${status}`} className={`inline-block h-2 w-2 rounded-full ${color}`} data-testid="status-dot" />;
}

