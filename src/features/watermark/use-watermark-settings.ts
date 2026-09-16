"use client";

import { useState, useCallback } from "react";
import type {
  WatermarkFieldVisibility,
  WatermarkPosition,
  WatermarkTemplate,
  WatermarkVisualSettings,
} from "@/types/watermark";
import { createWatermarkSettingsForTemplate } from "@/lib/image/templates";

export interface UseWatermarkSettingsReturn {
  settings: WatermarkVisualSettings;
  setTemplate: (template: WatermarkTemplate) => void;
  setPosition: (position: WatermarkPosition) => void;
  setOpacity: (opacity: number) => void;
  toggleField: (field: keyof WatermarkFieldVisibility) => void;
  resetSettings: () => void;
}

/**
 * Hook pengelola pengaturan visual template watermark (Phase 6).
 * Mendukung template: Default, Ringkas, dan Detail sesuai PRD #20.
 */
export function useWatermarkSettings(
  initialTemplate: WatermarkTemplate = "default",
): UseWatermarkSettingsReturn {
  const [settings, setSettings] = useState<WatermarkVisualSettings>(() =>
    createWatermarkSettingsForTemplate(initialTemplate),
  );

  const setTemplate = useCallback((template: WatermarkTemplate) => {
    setSettings(createWatermarkSettingsForTemplate(template));
  }, []);

  const setPosition = useCallback((position: WatermarkPosition) => {
    setSettings((prev) => ({ ...prev, position }));
  }, []);

  const setOpacity = useCallback((opacity: number) => {
    setSettings((prev) => ({ ...prev, opacity: Math.max(0.1, Math.min(1.0, opacity)) }));
  }, []);

  const toggleField = useCallback((field: keyof WatermarkFieldVisibility) => {
    setSettings((prev) => ({
      ...prev,
      visibleFields: {
        ...prev.visibleFields,
        [field]: !prev.visibleFields[field],
      },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(createWatermarkSettingsForTemplate(initialTemplate));
  }, [initialTemplate]);

  return {
    settings,
    setTemplate,
    setPosition,
    setOpacity,
    toggleField,
    resetSettings,
  };
}
