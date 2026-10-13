import { designDevDetails } from "./design-dev";
import { ecomSearchDetails } from "./ecom-search";
import { mediaAiDetails } from "./media-ai";
import type { ServiceDetail } from "./types";

export type { ServiceDetail, ServiceVisual, TitledItem } from "./types";

/** Keyword research and extended page content, keyed by service slug. */
export const serviceDetails: Record<string, ServiceDetail> = {
  ...designDevDetails,
  ...ecomSearchDetails,
  ...mediaAiDetails,
};
