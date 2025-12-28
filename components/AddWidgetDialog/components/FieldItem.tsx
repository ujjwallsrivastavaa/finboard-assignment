"use client";

import { Reorder, useDragControls } from "framer-motion";
import { ArrowUp, ArrowDown, X, GripVertical } from "lucide-react";
import type { SelectedField } from "@/lib/types/field";

interface FieldItemProps {
  field: SelectedField;
  index: number;
  selectedFields: SelectedField[];
  setSelectedFields: React.Dispatch<React.SetStateAction<SelectedField[]>>;
  moveFieldUp: (i: number) => void;
  moveFieldDown: (i: number) => void;
}

export const FieldItem = ({
  field,
  index,
  selectedFields,
  setSelectedFields,
  moveFieldUp,
  moveFieldDown,
}: FieldItemProps) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={field.path}
      value={field}
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-2 p-3 rounded-lg
        bg-emerald-900/20 border border-emerald-700/30
        hover:bg-emerald-900/30 transition-colors"
    >
      <GripVertical
        className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          dragControls.start(e);
        }}
      />
      <div className="flex-1 flex items-center justify-between gap-3">
        <code className="text-sm text-emerald-300 break-all">{field.name}</code>
        <span className="text-xs text-muted-foreground font-mono">{field.type}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => moveFieldUp(index)}
          disabled={index === 0}
          className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Move up"
        >
          <ArrowUp className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={() => moveFieldDown(index)}
          disabled={index === selectedFields.length - 1}
          className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Move down"
        >
          <ArrowDown className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedFields(
              selectedFields.filter((f) => f.path !== field.path)
            );
          }}
          className="p-1 rounded hover:bg-red-900/50 transition-colors ml-1"
          title="Remove"
        >
          <X className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </Reorder.Item>
  );
};
