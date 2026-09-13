"use client";

import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";

const CHOICES = [
  { value: "system", label: "Match system", Icon: IconDeviceDesktop },
  { value: "light", label: "Light", Icon: IconSun },
  { value: "dark", label: "Dark", Icon: IconMoon },
] as const;

/** Appearance choices for a dropdown menu; the menu stays open while the visitor compares them. */
export function AppearanceMenuGroup() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>Appearance</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={(value) => setTheme(String(value))}>
        {CHOICES.map(({ value, label, Icon }) => (
          <DropdownMenuRadioItem key={value} value={value} closeOnClick={false}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  );
}
