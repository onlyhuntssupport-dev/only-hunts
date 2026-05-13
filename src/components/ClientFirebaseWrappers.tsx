"use client";

import dynamic from "next/dynamic";

export const ClientEndorsementBanner = dynamic(
  () => import("@/components/marketplace/EndorsementBanner"),
  { ssr: false }
);

export const ClientWhatsAppWidget = dynamic(
  () => import("@/components/ui/WhatsAppWidget"),
  { ssr: false }
);