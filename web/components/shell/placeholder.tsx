import { Card, SoonBadge } from "@/components/ui/card";

export function Placeholder({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="font-accent text-2xl font-bold">{title}</h1>
        <SoonBadge />
      </div>
      <Card>
        <p className="font-semibold">{message}</p>
      </Card>
    </div>
  );
}
