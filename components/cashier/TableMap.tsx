"use client";

import {
  Grip,
  LayoutPanelTop,
  Move,
  Save,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { useUpdateTablePosition } from "@/components/cashier/useCashierTables";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CashierTable } from "@/lib/validations/cashier";

type TableMapProps = {
  canEditLayout: boolean;
  onTableClick: (table: CashierTable) => void;
  selectedTableId: string | null;
  tables: CashierTable[];
};

type TableVisualStatus =
  | "available"
  | "occupied"
  | "in_progress"
  | "awaiting_payment"
  | "closed";

type TablePosition = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  tableId: string;
};

type LegendPillProps = {
  colorClassName: string;
  icon: LucideIcon;
  label: string;
};

type TableCardProps = {
  isDragging: boolean;
  isEditMode: boolean;
  isSelected: boolean;
  onClick: () => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  table: CashierTable;
};

const CARD_SIZE = 128;
const GRID_GAP_X = 56;
const GRID_GAP_Y = 84;
const GRID_START_X = 24;
const GRID_START_Y = 24;

const TABLE_STATUS_STYLES: Record<
  TableVisualStatus,
  {
    badgeClassName: string;
    borderClassName: string;
    label: string;
    ringClassName: string;
  }
> = {
  available: {
    badgeClassName: "bg-emerald-500 text-white",
    borderClassName: "border-emerald-500",
    label: "LIBRE",
    ringClassName: "ring-emerald-500",
  },
  occupied: {
    badgeClassName: "bg-amber-500 text-white",
    borderClassName: "border-amber-500",
    label: "OCUPADA",
    ringClassName: "ring-amber-500",
  },
  in_progress: {
    badgeClassName: "bg-blue-500 text-white",
    borderClassName: "border-blue-500",
    label: "EN CURSO",
    ringClassName: "ring-blue-500",
  },
  awaiting_payment: {
    badgeClassName: "bg-purple-500 text-white",
    borderClassName: "border-purple-500",
    label: "CUENTA PEDIDA",
    ringClassName: "ring-purple-500",
  },
  closed: {
    badgeClassName: "bg-rose-500 text-white",
    borderClassName: "border-rose-500",
    label: "CERRADA",
    ringClassName: "ring-rose-500",
  },
};

function getVisualStatus(table: CashierTable): TableVisualStatus {
  if (table.status === "available") {
    return "available";
  }

  if (table.status === "awaiting_payment") {
    return "awaiting_payment";
  }

  if (table.status === "closed") {
    return "closed";
  }

  if (table.active_item_count > 0) {
    return "in_progress";
  }

  return "occupied";
}

function getGridColumns(containerWidth: number) {
  if (containerWidth >= 1024) {
    return 4;
  }

  if (containerWidth >= 640) {
    return 3;
  }

  return 2;
}

function getFallbackPosition(index: number, containerWidth: number): TablePosition {
  const safeWidth = containerWidth > 0 ? containerWidth : 960;
  const columns = getGridColumns(safeWidth);
  const column = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: GRID_START_X + column * (CARD_SIZE + GRID_GAP_X),
    y: GRID_START_Y + row * (CARD_SIZE + GRID_GAP_Y),
  };
}

function getInitialPositions(
  tables: CashierTable[],
  containerWidth: number,
): Record<string, TablePosition> {
  return Object.fromEntries(
    tables.map((table, index) => [
      table.id,
      table.pos_x === 0 && table.pos_y === 0
        ? getFallbackPosition(index, containerWidth)
        : {
            x: table.pos_x,
            y: table.pos_y,
          },
    ]),
  );
}

function clampPosition(value: number, maxValue: number) {
  return Math.max(0, Math.min(value, Math.max(0, maxValue)));
}

function LegendPill({ colorClassName, icon: Icon, label }: LegendPillProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
      <Icon className={cn("h-4 w-4", colorClassName)} />
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
        {label}
      </span>
    </div>
  );
}

function TableCard({
  isDragging,
  isEditMode,
  isSelected,
  onClick,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  table,
}: TableCardProps) {
  const visualStatus = getVisualStatus(table);
  const statusStyle = TABLE_STATUS_STYLES[visualStatus];

  return (
    <button
      type="button"
      className={cn(
        "relative flex h-32 w-32 flex-col items-center justify-center rounded-2xl border border-stone-200 border-b-4 bg-white px-3 pb-5 pt-4 text-center shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
        isEditMode ? "cursor-grab touch-none active:cursor-grabbing" : undefined,
        isDragging ? "z-20 scale-[1.02] shadow-2xl" : undefined,
        statusStyle.borderClassName,
        isSelected ? cn("ring-2 ring-offset-2", statusStyle.ringClassName) : undefined,
      )}
      onClick={onClick}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      title={table.name}
    >
      <span
        className={cn(
          "absolute -top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm",
          statusStyle.badgeClassName,
        )}
      >
        {statusStyle.label}
      </span>

      <span className="max-w-full text-center text-base font-bold text-stone-800">
        {table.name}
      </span>
      <span className="mt-2 text-3xl font-black leading-none text-stone-900">
        {table.capacity}
      </span>
      <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
        {table.active_item_count > 0
          ? `${table.active_item_count} item${table.active_item_count === 1 ? "" : "s"}`
          : `Cap. ${table.capacity}`}
      </span>
    </button>
  );
}

export function TableMap({
  canEditLayout,
  onTableClick,
  selectedTableId,
  tables,
}: TableMapProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [draftPositions, setDraftPositions] = useState<Record<string, TablePosition>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const updateTablePosition = useUpdateTablePosition();

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const element = canvasRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);
    setContainerWidth(element.clientWidth);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (dragState) {
      return;
    }

    setDraftPositions(getInitialPositions(tables, containerWidth));
  }, [containerWidth, dragState, tables]);

  useEffect(() => {
    if (!isEditMode) {
      setDragState(null);
    }
  }, [isEditMode]);

  const positionedTables = useMemo(
    () =>
      tables.map((table, index) => ({
        position:
          draftPositions[table.id] ?? getFallbackPosition(index, containerWidth),
        table,
      })),
    [containerWidth, draftPositions, tables],
  );

  const canvasMinHeight =
    tables.length === 0
      ? 600
      : Math.max(
          600,
          ...positionedTables.map(({ position }) => position.y + CARD_SIZE + GRID_START_Y),
        );
  const canvasMinWidth =
    tables.length === 0
      ? 640
      : Math.max(
          640,
          ...positionedTables.map(({ position }) => position.x + CARD_SIZE + GRID_START_X),
        );

  async function persistPosition(
    tableId: string,
    nextPosition: TablePosition,
    previousPosition: TablePosition,
  ) {
    try {
      await updateTablePosition.mutateAsync({
        tableId,
        posX: Math.round(nextPosition.x),
        posY: Math.round(nextPosition.y),
      });
      setLayoutError(null);
    } catch (error) {
      setDraftPositions((currentPositions) => ({
        ...currentPositions,
        [tableId]: previousPosition,
      }));
      setLayoutError(
        error instanceof Error
          ? error.message
          : "No pudimos guardar la nueva posicion de la mesa.",
      );
    }
  }

  function handlePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    tableId: string,
  ) {
    if (!isEditMode) {
      return;
    }

    const currentPosition = draftPositions[tableId];

    if (!currentPosition) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setLayoutError(null);
    setDragState({
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: currentPosition.x,
      startY: currentPosition.y,
      tableId,
    });
  }

  function handlePointerMove(
    event: ReactPointerEvent<HTMLButtonElement>,
    tableId: string,
  ) {
    if (
      !dragState ||
      dragState.pointerId !== event.pointerId ||
      dragState.tableId !== tableId ||
      !canvasRef.current
    ) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const maxX = rect.width - CARD_SIZE;
    const maxY = rect.height - CARD_SIZE;
    const deltaX = event.clientX - dragState.startPointerX;
    const deltaY = event.clientY - dragState.startPointerY;

    setDraftPositions((currentPositions) => ({
      ...currentPositions,
      [tableId]: {
        x: clampPosition(dragState.startX + deltaX, maxX),
        y: clampPosition(dragState.startY + deltaY, maxY),
      },
    }));
  }

  async function finishDrag(
    event: ReactPointerEvent<HTMLButtonElement>,
    tableId: string,
  ) {
    if (
      !dragState ||
      dragState.pointerId !== event.pointerId ||
      dragState.tableId !== tableId
    ) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const previousPosition = {
      x: dragState.startX,
      y: dragState.startY,
    };
    const nextPosition = draftPositions[tableId] ?? previousPosition;

    setDragState(null);

    if (
      Math.round(previousPosition.x) === Math.round(nextPosition.x) &&
      Math.round(previousPosition.y) === Math.round(nextPosition.y)
    ) {
      return;
    }

    await persistPosition(tableId, nextPosition, previousPosition);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border/80 bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <LegendPill colorClassName="text-emerald-500" icon={LayoutPanelTop} label="Libre" />
          <LegendPill colorClassName="text-amber-500" icon={LayoutPanelTop} label="Ocupada" />
          <LegendPill colorClassName="text-blue-500" icon={LayoutPanelTop} label="En curso" />
          <LegendPill
            colorClassName="text-purple-500"
            icon={LayoutPanelTop}
            label="Cuenta pedida"
          />
          <LegendPill colorClassName="text-rose-500" icon={LayoutPanelTop} label="Cerrada" />
        </div>

        {canEditLayout ? (
          <div className="flex items-center gap-3">
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                Arrastrá las mesas y soltá para guardar la nueva posición.
              </p>
            )}
            <Button
              type="button"
              variant={isEditMode ? "default" : "outline"}
              onClick={() => setIsEditMode((currentValue) => !currentValue)}
            >
              {isEditMode ? <Save className="mr-2 h-4 w-4" /> : <Grip className="mr-2 h-4 w-4" />}
              {isEditMode ? "Salir de edición" : "Mover mesas"}
            </Button>
          </div>
        ) : null}
      </div>

      {layoutError ? (
        <p className="text-sm text-destructive">{layoutError}</p>
      ) : null}

      {tables.length === 0 ? (
        <div className="flex min-h-[600px] items-center justify-center rounded-[2.5rem] border-[12px] border-white bg-[#e8e4e2] p-12 text-center shadow-inner [background-image:radial-gradient(#c8c4c2_1px,transparent_1px)] [background-size:32px_32px]">
          <div className="max-w-sm space-y-3">
            <p className="text-lg font-semibold text-stone-800">
              No hay mesas configuradas.
            </p>
            <p className="text-sm text-stone-600">
              Crea mesas desde el panel de administracion para empezar a usar la vista de caja.
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={canvasRef}
          className="relative overflow-auto rounded-[2.5rem] border-[12px] border-white bg-[#e8e4e2] p-12 shadow-inner [background-image:radial-gradient(#c8c4c2_1px,transparent_1px)] [background-size:32px_32px]"
          style={{
            minHeight: canvasMinHeight,
            minWidth: canvasMinWidth,
          }}
        >
          {positionedTables.map(({ position, table }) => (
            <div
              key={table.id}
              className="absolute"
              style={{ left: position.x, top: position.y }}
            >
              <TableCard
                isDragging={dragState?.tableId === table.id}
                isEditMode={isEditMode}
                isSelected={selectedTableId === table.id}
                onClick={() => {
                  if (!isEditMode) {
                    onTableClick(table);
                  }
                }}
                onPointerCancel={(event) => {
                  void finishDrag(event, table.id);
                }}
                onPointerDown={(event) => handlePointerDown(event, table.id)}
                onPointerMove={(event) => handlePointerMove(event, table.id)}
                onPointerUp={(event) => {
                  void finishDrag(event, table.id);
                }}
                table={table}
              />
            </div>
          ))}

          {isEditMode ? (
            <div className="pointer-events-none absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-700 shadow-sm">
              <Move className="h-4 w-4 text-stone-500" />
              Arrastra para mover
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
