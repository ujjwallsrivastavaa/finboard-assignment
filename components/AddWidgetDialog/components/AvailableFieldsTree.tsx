"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { FieldDiscoveryService } from "@/lib/services/fieldDiscoveryService";
import type { FieldNode, SelectedField } from "@/lib/types/field";

interface AvailableFieldsTreeProps {
  apiFields: FieldNode[];
  selectedFields: SelectedField[];
  setSelectedFields: React.Dispatch<React.SetStateAction<SelectedField[]>>;
  expandedFields: Set<string>;
  toggleFieldExpansion: (path: string) => void;
}

export const AvailableFieldsTree = ({
  apiFields,
  selectedFields,
  setSelectedFields,
  expandedFields,
  toggleFieldExpansion,
}: AvailableFieldsTreeProps) => {
  const renderFieldTree = (fields: FieldNode[], level = 0): React.ReactNode => {
    return fields.map((field) => {
      const isExpanded = expandedFields.has(field.path);
      const hasChildren = field.children && field.children.length > 0;
      const isSelectable = !hasChildren;

      return (
        <div key={field.path}>
          <label
            className={`flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors ${
              isSelectable ? "cursor-pointer" : ""
            }`}
            style={{ marginLeft: `${level * 1.5}rem` }}
          >
            {hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleFieldExpansion(field.path);
                }}
                className="p-0 hover:bg-slate-600/50 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
            )}
            {isSelectable && (
              <input
                type="checkbox"
                checked={selectedFields.some((sf) => sf.path === field.path)}
                onChange={(e) => {
                  if (e.target.checked) {
                    const newField = FieldDiscoveryService.createSelectedField(
                      field,
                      selectedFields.length
                    );
                    setSelectedFields([...selectedFields, newField]);
                  } else {
                    setSelectedFields(
                      selectedFields.filter((f) => f.path !== field.path)
                    );
                  }
                }}
                className="w-4 h-4 rounded accent-emerald-500"
              />
            )}
            <div className="flex-1 flex items-center justify-between gap-3">
              <code className="text-sm text-slate-300 break-all">
                {field.name}
              </code>
              <span className="text-xs text-slate-500 font-mono">
                {field.type}
              </span>
            </div>
          </label>
          {hasChildren &&
            isExpanded &&
            renderFieldTree(field.children!, level + 1)}
        </div>
      );
    });
  };

  return <>{renderFieldTree(apiFields)}</>;
};
