import type { ComponentProps } from "react";
import { IconDeviceMobile } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function Pattern({ children = "Install app", ...props }: ComponentProps<typeof Button>) {
  return (
    <Button size="lg" {...props}>
      {children}
      <IconDeviceMobile data-icon="inline-end" aria-hidden="true" />
    </Button>
  );
}
