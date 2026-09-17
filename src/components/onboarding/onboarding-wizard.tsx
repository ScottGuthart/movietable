"use client";

import { useMemo, useState } from "react";
import { IconArrowLeft, IconArrowRight, IconCheck, IconClock, IconPlayerSkipForward } from "@tabler/icons-react";
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Stepper, StepperContent, StepperIndicator, StepperItem, StepperNav, StepperPanel, StepperSeparator, StepperTitle, StepperTrigger } from "@/components/reui/stepper";
import { Button } from "@/components/ui/button";
import { RatingControl } from "@/components/taste/rating-control";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Provider } from "@/lib/catalogue";
import type { ProviderUsage } from "@/components/movie-grid/services-popover";
import type { MyServices } from "@/components/movie-grid/use-my-services";
import { ProviderIcon } from "@/components/movie-grid/provider-icon";
import type { Density } from "@/components/movie-grid/display-popover";
import type { ScoredMovie } from "@/lib/movies";
import type { Taste } from "@/components/taste/use-taste";
import type { Verdict } from "@/lib/taste";
import { useOnboardingState } from "@/hooks/use-onboarding-state";

const STEPS = ["Services", "Display", "Rate films"] as const;
const RATING_TARGET = 10;

interface Props {
  providers: ProviderUsage[];
  services: MyServices;
  onServicesChange: (next: MyServices) => void;
  density: Density;
  onDensityChange: (next: Density) => void;
  showContext: boolean;
  onShowContextChange: (next: boolean) => void;
  taste: Taste;
  movies: ScoredMovie[];
  onClose: () => void;
}

export function OnboardingWizard({ providers, services, onServicesChange, density, onDensityChange, showContext, onShowContextChange, taste, movies, onClose }: Props) {
  const onboarding = useOnboardingState();
  const ratingsNeeded = Math.max(0, RATING_TARGET - taste.rated);
  const hasRatingsStep = ratingsNeeded > 0;
  const steps = hasRatingsStep ? STEPS : STEPS.slice(0, 2);
  const [step, setStep] = useState(() => Math.min(onboarding.step, steps.length - 1));
  const [selected, setSelected] = useState<Record<string, Verdict>>({});
  const [dismissed, setDismissed] = useState(false);
  const ratingMovies = useMemo(() => movies.filter((movie) => !taste.verdicts[movie.slug]).slice(0, ratingsNeeded), [movies, ratingsNeeded, taste.verdicts]);
  const open = onboarding.shouldShow && !dismissed;
  console.log("[v0] wizard render", { open, dismissed, ready: onboarding.ready, completed: onboarding.completed, snoozedUntil: onboarding.snoozedUntil, rated: taste.rated });

  // Closing flips local state first so the dialog disappears even if persistence fails.
  const dismiss = (persist: () => void) => {
    console.log("[v0] wizard dismiss called");
    setDismissed(true);
    persist();
    onClose();
  };
  const finish = () => dismiss(onboarding.complete);
  const snooze = () => dismiss(onboarding.snooze);
  const advance = () => {
    if (step === steps.length - 1) return finish();
    const next = step + 1;
    setStep(next);
    onboarding.setStep(next);
  };
  const rate = (slug: string, verdict: Verdict) => {
    setSelected((current) => ({ ...current, [slug]: verdict }));
    taste.rate(slug, verdict);
  };

  return (
    <Dialog open={open} onOpenChange={(next, details) => { console.log("[v0] dialog onOpenChange", next, details?.reason); if (!next) snooze(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Make MovieTable yours</DialogTitle>
          <DialogDescription>Choose a few preferences and rate films to make your table more useful.</DialogDescription>
        </DialogHeader>
        <Stepper value={step + 1} onValueChange={(value) => { const next = value - 1; setStep(next); onboarding.setStep(next); }}>
          <Frame stacked className="w-full">
            <FrameHeader><FrameTitle>Quick setup</FrameTitle><FrameDescription>Everything can be changed later.</FrameDescription></FrameHeader>
            <FramePanel className="overflow-x-auto"><StepperNav aria-label="Onboarding progress" className="min-w-full items-center">
              {steps.map((title, index) => <StepperItem key={title} step={index + 1}><StepperTrigger type="button"><StepperIndicator>{index < step ? <IconCheck aria-hidden="true" /> : index + 1}</StepperIndicator><StepperTitle className="hidden sm:block">{title}</StepperTitle></StepperTrigger>{index < steps.length - 1 && <StepperSeparator />}</StepperItem>)}
            </StepperNav></FramePanel>
            <FramePanel><StepperPanel className="text-sm">
              <StepperContent value={1}><div className="flex flex-col gap-5"><div><h3 className="text-lg font-semibold">Where do you watch?</h3><p className="text-muted-foreground mt-1 leading-relaxed">Pick subscriptions you already have. This only changes the availability filter.</p></div><div className="grid gap-2 sm:grid-cols-2">{providers.slice(0, 12).map((provider: Provider) => { const checked = services.ids.includes(provider.id); return <label key={provider.id} className="border-border hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3"><Checkbox checked={checked} onCheckedChange={(value) => onServicesChange({ ...services, ids: value === true ? [...services.ids, provider.id] : services.ids.filter((id) => id !== provider.id) })} /><ProviderIcon name={provider.name} iconUrl={provider.icon_url} scope="offer" /><span className="min-w-0 flex-1 truncate">{provider.name}</span></label>; })}</div><div className="flex items-center justify-between gap-3 border-t pt-4"><FieldLabel htmlFor="onboarding-only-mine">Only show films I can stream</FieldLabel><Switch id="onboarding-only-mine" checked={services.onlyMine} onCheckedChange={(value) => onServicesChange({ ...services, onlyMine: value })} /></div></div></StepperContent>
              <StepperContent value={2}><div className="flex flex-col gap-5"><div><h3 className="text-lg font-semibold">Tune your table</h3><p className="text-muted-foreground mt-1 leading-relaxed">Set the row density and decide whether extra film context is visible.</p></div><FieldGroup className="gap-4"><Field orientation="horizontal" className="items-center justify-between gap-4"><FieldLabel htmlFor="onboarding-density">Row density</FieldLabel><Select value={density} onValueChange={(value) => onDensityChange(value as Density)}><SelectTrigger id="onboarding-density" className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="comfortable">Comfortable</SelectItem><SelectItem value="compact">Compact</SelectItem></SelectContent></Select></Field><Field orientation="horizontal" className="items-center justify-between gap-4"><FieldLabel htmlFor="onboarding-context">Details under titles</FieldLabel><Switch id="onboarding-context" checked={showContext} onCheckedChange={onShowContextChange} /></Field></FieldGroup></div></StepperContent>
              {hasRatingsStep && <StepperContent value={3}><div className="flex flex-col gap-5"><div><h3 className="text-lg font-semibold">Rate a few films</h3><p className="text-muted-foreground mt-1 leading-relaxed">Rate {RATING_TARGET} films to unlock your personal For you ranking. {taste.rated} of {RATING_TARGET} rated.</p></div><div className="flex flex-col gap-3">{ratingMovies.map((movie) => <div key={movie.slug} className="border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-medium">{movie.title}</p><p className="text-muted-foreground text-sm">{movie.year} · {movie.subgenres.slice(0, 2).join(" · ") || "Film"}</p></div><div className="flex items-center gap-3"><RatingControl size="touch" title={movie.title} verdict={selected[movie.slug] ?? taste.verdicts[movie.slug]} onChange={(verdict) => rate(movie.slug, verdict ?? "skip")} /><Button size="sm" variant="ghost" onClick={() => rate(movie.slug, "skip")}>Skip</Button></div></div>)}</div></div></StepperContent>}
            </StepperPanel></FramePanel>
            <FrameFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><Button variant="ghost" onClick={snooze}><IconClock data-icon="inline-start" />Ask me later</Button><Button variant="ghost" onClick={finish}><IconPlayerSkipForward data-icon="inline-start" />Skip setup</Button></div><div className="flex gap-2"><Button variant="outline" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}><IconArrowLeft data-icon="inline-start" />Back</Button><Button onClick={advance}>{step === steps.length - 1 ? "Finish" : "Continue"}<IconArrowRight data-icon="inline-end" /></Button></div></FrameFooter>
          </Frame>
        </Stepper>
      </DialogContent>
    </Dialog>
  );
}
