"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DateRangePickerProps = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
};

function formatDateForInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getPresetRange(days: number) {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - (days - 1));

  return {
    from: formatDateForInput(fromDate),
    to: formatDateForInput(toDate),
  };
}

export function DateRangePicker({
  from,
  to,
  onChange,
}: DateRangePickerProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:flex-row md:items-end md:justify-between">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="report-from">Desde</Label>
          <Input
            id="report-from"
            type="date"
            value={from}
            onChange={(event) => onChange(event.target.value, to)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="report-to">Hasta</Label>
          <Input
            id="report-to"
            type="date"
            value={to}
            onChange={(event) => onChange(from, event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const range = getPresetRange(1);
            onChange(range.from, range.to);
          }}
        >
          Hoy
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const range = getPresetRange(7);
            onChange(range.from, range.to);
          }}
        >
          7 dias
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const range = getPresetRange(30);
            onChange(range.from, range.to);
          }}
        >
          30 dias
        </Button>
      </div>
    </div>
  );
}
