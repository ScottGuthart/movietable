"use client";

import { useMemo, useState } from "react";
import { IconDeviceTv, IconSearch, IconX } from "@tabler/icons-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ProviderIcon } from "@/components/movie-grid/provider-icon";
import type { MyServices } from "@/components/movie-grid/use-my-services";
import type { Provider } from "@/lib/catalogue";
import { numberFormat } from "@/lib/movies";

export interface ProviderUsage extends Provider {
  /** Films streamable on this provider in the whole catalogue. */
  films: number;
}

interface ServicesPopoverProps {
  providers: ProviderUsage[];
  services: MyServices;
  onChange: (next: MyServices) => void;
}

/** Pick the subscriptions you pay for once; the table can then show only what you can stream tonight. */
export function ServicesPopover({ providers, services, onChange }: ServicesPopoverProps) {
  const [search, setSearch] = useState("");
  const term = search.trim().toLocaleLowerCase("en-US");
  const visible = useMemo(
    () => providers.filter((provider) => !term || provider.name.toLocaleLowerCase("en-US").includes(term)),
    [providers, term],
  );
  const selected = new Set(services.ids);
  const toggle = (id: number, checked: boolean) => {
    const ids = checked ? [...services.ids, id] : services.ids.filter((current) => current !== id);
    onChange({ ...services, ids });
  };

  return (
    <Popover>
      <PopoverTrigger render={<Button type="button" variant="outline" />}>
        <IconDeviceTv data-icon="inline-start" aria-hidden="true" />
        My services
        {services.ids.length > 0 && <Badge variant="secondary">{services.ids.length}</Badge>}
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[min(70vh,32rem)] w-[320px] overflow-y-auto p-0">
        <FieldGroup className="gap-3 px-3.5 py-3">
          <Field orientation="horizontal" className="min-h-9 items-center justify-between gap-3">
            <FieldLabel htmlFor="services-only-mine" className="text-sm font-normal">Only films I can stream</FieldLabel>
            <Switch id="services-only-mine" size="sm" checked={services.onlyMine} disabled={services.ids.length === 0 && !services.includeFree}
              onCheckedChange={(checked) => onChange({ ...services, onlyMine: checked })} />
          </Field>
          <Field orientation="horizontal" className="min-h-9 items-center justify-between gap-3">
            <FieldLabel htmlFor="services-free" className="text-sm font-normal">Count free with ads</FieldLabel>
            <Checkbox id="services-free" checked={services.includeFree} onCheckedChange={(checked) => onChange({ ...services, includeFree: checked === true })} />
          </Field>
        </FieldGroup>
        <FieldSeparator />
        <div className="flex flex-col gap-2 px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs font-medium">Your services</p>
            {services.ids.length > 0 && (
              <Button type="button" size="xs" variant="ghost" onClick={() => onChange({ ...services, ids: [] })}>Clear</Button>
            )}
          </div>
          <InputGroup>
            <InputGroupAddon><IconSearch aria-hidden="true" /></InputGroupAddon>
            <InputGroupInput placeholder="Find a service…" aria-label="Find a service" value={search} onChange={(event) => setSearch(event.target.value)} />
            {search && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton aria-label="Clear" size="icon-xs" onClick={() => setSearch("")}><IconX aria-hidden="true" /></InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          <ul className="-mx-1.5 flex max-h-64 flex-col overflow-y-auto" aria-label="Services">
            {visible.length === 0 && <li className="text-muted-foreground px-1.5 py-2 text-sm">No service matches.</li>}
            {visible.map((provider) => {
              const id = `service-${provider.id}`;
              return (
                <li key={provider.id}>
                  <label htmlFor={id} className="group/offer hover:bg-muted/40 flex cursor-pointer items-center gap-2.5 px-1.5 py-1.5 text-sm">
                    <Checkbox id={id} checked={selected.has(provider.id)} onCheckedChange={(checked) => toggle(provider.id, checked === true)} />
                    <ProviderIcon name={provider.name} iconUrl={provider.icon_url} scope="offer" />
                    <span className="min-w-0 flex-1 truncate">{provider.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{numberFormat.format(provider.films)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
