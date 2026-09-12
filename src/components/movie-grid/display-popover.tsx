"use client";

import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type Density = "compact" | "comfortable";

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
];

interface DisplayPopoverProps {
  density: Density;
  onDensityChange: (density: Density) => void;
  showContext: boolean;
  onShowContextChange: (show: boolean) => void;
}

export function DisplayPopover({ density, onDensityChange, showContext, onShowContextChange }: DisplayPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger render={<Button type="button" variant="outline" />}>
        <IconAdjustmentsHorizontal data-icon="inline-start" aria-hidden="true" />
        Display
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-0">
        <FieldGroup className="gap-3 px-3.5 py-3">
          <div className="text-muted-foreground text-xs font-medium">Rows</div>
          <div className="flex flex-col">
            <Field orientation="horizontal" className="min-h-9 items-center justify-between gap-3">
              <FieldLabel htmlFor="movie-density" className="text-sm font-normal">Density</FieldLabel>
              <Select value={density} onValueChange={(value) => onDensityChange(value as Density)}>
                <SelectTrigger id="movie-density" size="sm" className="w-[132px] shrink-0">
                  <SelectValue>{DENSITY_OPTIONS.find((option) => option.value === density)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectGroup>
                    {DENSITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal" className="min-h-9 items-center justify-between gap-3">
              <FieldLabel htmlFor="movie-context-line" className="text-sm font-normal">Scores under the title</FieldLabel>
              <Switch id="movie-context-line" size="sm" checked={showContext} onCheckedChange={onShowContextChange} />
            </Field>
          </div>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
}
