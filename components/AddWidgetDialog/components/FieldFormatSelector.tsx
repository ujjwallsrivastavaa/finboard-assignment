/**
 * Field Format Selector Component
 * Allows users to configure formatting for selected fields
 */

import { useState } from "react";
import type {
  SelectedField,
  FieldFormat,
  FormatType,
  CurrencyCode,
} from "@/lib/types/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDefaultFormat, suggestFormatType } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface FieldFormatSelectorProps {
  field: SelectedField;
  onFormatChange: (fieldPath: string, format: FieldFormat | undefined) => void;
  onNameChange: (fieldPath: string, newName: string) => void;
}

export default function FieldFormatSelector({
  field,
  onFormatChange,
  onNameChange,
}: FieldFormatSelectorProps) {
  const [format, setFormat] = useState<FieldFormat | undefined>(field.format);
  const [fieldName, setFieldName] = useState<string>(field.name);

  const handleFormatTypeChange = (type: FormatType) => {
    const newFormat = type === "none" ? undefined : getDefaultFormat(type);
    setFormat(newFormat);
    onFormatChange(field.path, newFormat);
  };

  const handleFormatUpdate = (updates: Partial<FieldFormat>) => {
    if (!format) return;
    const newFormat = { ...format, ...updates };
    setFormat(newFormat);
    onFormatChange(field.path, newFormat);
  };

  const handleNameChange = (newName: string) => {
    setFieldName(newName);
    onNameChange(field.path, newName);
  };

  const handleAutoSuggest = () => {
    const suggestedType = suggestFormatType(field.name, field.type);
    if (suggestedType !== "none") {
      handleFormatTypeChange(suggestedType);
    }
  };

  const currentType = format?.type || "none";

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-card/50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1 block">
            Display Name
          </Label>
          <Input
            type="text"
            value={fieldName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Field name"
            className="bg-background border-border text-sm h-8"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAutoSuggest}
          className="h-8 text-xs gap-1 text-blue-400 hover:text-blue-300 mt-5"
        >
          <Sparkles className="w-3 h-3" />
          Auto
        </Button>
      </div>

      <div className="text-xs text-muted-foreground -mt-1">
        Path: <code className="text-foreground/70">{field.path}</code>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Format Type</Label>
        <Select value={currentType} onValueChange={handleFormatTypeChange}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="currency">Currency</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="compact-number">Compact Number</SelectItem>
            <SelectItem value="decimal">Decimal</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="datetime">Date & Time</SelectItem>
            <SelectItem value="time">Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Currency-specific options */}
      {currentType === "currency" && format && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Currency</Label>
          <Select
            value={format.currency || "USD"}
            onValueChange={(value) =>
              handleFormatUpdate({ currency: value as CurrencyCode })
            }
          >
            <SelectTrigger className="bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="JPY">JPY (¥)</SelectItem>
              <SelectItem value="CNY">CNY (¥)</SelectItem>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="AUD">AUD (A$)</SelectItem>
              <SelectItem value="CAD">CAD (C$)</SelectItem>
              <SelectItem value="CHF">CHF (Fr)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Decimal places for numeric formats */}
      {(currentType === "currency" ||
        currentType === "percentage" ||
        currentType === "number" ||
        currentType === "decimal" ||
        currentType === "compact-number") &&
        format && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Decimal Places</Label>
            <Input
              type="number"
              min="0"
              max="10"
              value={format.decimals ?? 2}
              onChange={(e) =>
                handleFormatUpdate({ decimals: parseInt(e.target.value) || 0 })
              }
              className="bg-background border-border"
            />
          </div>
        )}

      {/* Prefix/Suffix */}
      {format && currentType !== "none" && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Prefix (Optional)</Label>
            <Input
              type="text"
              placeholder="e.g., $, #"
              value={format.prefix || ""}
              onChange={(e) => handleFormatUpdate({ prefix: e.target.value })}
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Suffix (Optional)</Label>
            <Input
              type="text"
              placeholder="e.g., USD, pts"
              value={format.suffix || ""}
              onChange={(e) => handleFormatUpdate({ suffix: e.target.value })}
              className="bg-background border-border"
            />
          </div>
        </>
      )}

      {/* Show sign for numbers */}
      {currentType === "number" && format && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`showSign-${field.path}`}
            checked={format.showSign || false}
            onChange={(e) => handleFormatUpdate({ showSign: e.target.checked })}
            className="rounded border-border"
          />
          <Label
            htmlFor={`showSign-${field.path}`}
            className="text-xs text-muted-foreground cursor-pointer"
          >
            Show + sign for positive numbers
          </Label>
        </div>
      )}
    </div>
  );
}
