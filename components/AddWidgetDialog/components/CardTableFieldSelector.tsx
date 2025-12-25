"use client";

import { useState } from "react";
import { Reorder } from "framer-motion";
import { FieldItem } from "./FieldItem";
import { FieldDiscoveryService } from "@/lib/services/fieldDiscoveryService";
import { AvailableFieldsTree } from "./AvailableFieldsTree";
import type { FieldNode, SelectedField } from "@/lib/types/field";

interface CardTableFieldSelectorProps {
  apiFields: FieldNode[];
  selectedFields: SelectedField[];
  setSelectedFields: React.Dispatch<React.SetStateAction<SelectedField[]>>;
}

export const CardTableFieldSelector = ({
  apiFields,
  selectedFields,
  setSelectedFields,
}: CardTableFieldSelectorProps) => {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const toggleFieldExpansion = (path: string): void => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const moveFieldUp = (index: number): void => {
    if (index === 0) return;
    const newFields = [...selectedFields];
    [newFields[index - 1], newFields[index]] = [
      newFields[index],
      newFields[index - 1],
    ];
    newFields.forEach((field, idx) => {
      field.order = idx;
    });
    setSelectedFields(newFields);
  };

  const moveFieldDown = (index: number): void => {
    if (index === selectedFields.length - 1) return;
    const newFields = [...selectedFields];
    [newFields[index], newFields[index + 1]] = [
      newFields[index + 1],
      newFields[index],
    ];
    newFields.forEach((field, idx) => {
      field.order = idx;
    });
    setSelectedFields(newFields);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Available Fields - Left Side */}
      <div className="flex flex-col">
        <label className="text-slate-300 mb-3 block font-medium text-sm">
          Available Fields (
          {FieldDiscoveryService.countSelectableFields(apiFields)})
        </label>
        <div className="space-y-2 max-h-[500px] overflow-y-auto border border-slate-700/50 rounded-lg p-4 bg-slate-800/20">
          <AvailableFieldsTree
            apiFields={apiFields}
            selectedFields={selectedFields}
            setSelectedFields={setSelectedFields}
            expandedFields={expandedFields}
            toggleFieldExpansion={toggleFieldExpansion}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Select fields to add them to your widget
        </p>
      </div>

      {/* Selected Fields - Right Side */}
      <div className="flex flex-col">
        <label className="text-slate-300 mb-3 block font-medium text-sm">
          Selected Fields ({selectedFields.length})
        </label>
        <div className="space-y-2 max-h-[500px] overflow-y-auto border border-emerald-700/50 rounded-lg p-4 bg-emerald-900/10">
          <Reorder.Group
            axis="y"
            values={selectedFields}
            onReorder={(newOrder) => {
              const reordered = newOrder.map((field, idx) => ({
                ...field,
                order: idx,
              }));
              setSelectedFields(reordered);
            }}
            className="space-y-2"
          >
            {selectedFields.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                No fields selected
              </div>
            ) : (
              selectedFields.map((field, index) => (
                <FieldItem
                  key={field.path}
                  field={field}
                  index={index}
                  selectedFields={selectedFields}
                  setSelectedFields={setSelectedFields}
                  moveFieldUp={moveFieldUp}
                  moveFieldDown={moveFieldDown}
                />
              ))
            )}
          </Reorder.Group>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Drag to reorder or use arrows. Order determines display sequence.
        </p>
      </div>
    </div>
  );
};
