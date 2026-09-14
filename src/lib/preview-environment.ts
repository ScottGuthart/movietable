import { resolve } from "node:path";

interface DeploymentMarkers {
  VERCEL?: string;
  VERCEL_ENV?: string;
}

/** The editor has no stable env marker; fail closed outside its exact workspace or on any Vercel deployment. */
export function isV0Sandbox(directory: string, deployment: DeploymentMarkers): boolean {
  return resolve(directory) === "/vercel/share/v0-project"
    && deployment.VERCEL === undefined
    && deployment.VERCEL_ENV === undefined;
}
