"use client";

import { useSyncExternalStore } from "react";
import { IconDeviceMobile } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

function subscribe(listener: () => void) {
  const display = window.matchMedia("(display-mode: standalone)");
  display.addEventListener("change", listener);
  window.addEventListener("appinstalled", listener);
  window.addEventListener("pageshow", listener);
  return () => {
    display.removeEventListener("change", listener);
    window.removeEventListener("appinstalled", listener);
    window.removeEventListener("pageshow", listener);
  };
}

function installationMode() {
  if (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone) return "standalone";
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return "browser";
}

export function InstallHelp() {
  const mode = useSyncExternalStore(subscribe, installationMode, () => "standalone");
  if (mode === "standalone") return null;

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="sm" />}>
        <IconDeviceMobile data-icon="inline-start" aria-hidden="true" />
        Install app
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Keep MovieTable close</PopoverTitle>
          <PopoverDescription>Add MovieTable to your home screen or desktop for a window of its own.</PopoverDescription>
        </PopoverHeader>
        <p className="leading-relaxed">
          {mode === "ios"
            ? <>Open this site in Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>. Leave <strong>Open as Web App</strong> on if offered, and tap <strong>Add</strong>.</>
            : <>In Chrome or Edge, look for <strong>Install</strong> in the address bar or browser menu. On Android, choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. In Safari on Mac, choose <strong>File → Add to Dock</strong>.</>}
        </p>
        <p className="text-muted-foreground leading-relaxed">An internet connection is still needed to browse films and access ratings. Installation options vary by browser; if none appear, you can keep using the website.</p>
      </PopoverContent>
    </Popover>
  );
}
