"use server"

import { getSiteSetting, updateSiteSetting } from "@/lib/actions/admin-settings"
import {
  CONFERENCE_DEFAULTS,
  type ConferenceSettings,
} from "@/lib/conference-settings-defaults"

// Re-export types for convenience (type-only, doesn't violate "use server")
export type { ConferenceSettings, ConferenceEmailTemplate } from "@/lib/conference-settings-defaults"

// ── Fetch with deep-merge fallback to defaults ────────────────────────────────
export async function getConferenceSettings(): Promise<ConferenceSettings> {
  try {
    const setting = await getSiteSetting("conference_settings")
    if (!setting?.value) return CONFERENCE_DEFAULTS

    const saved = setting.value as Partial<ConferenceSettings>
    return {
      ...CONFERENCE_DEFAULTS,
      ...saved,
      // Arrays: use saved value if present, otherwise fall back to defaults
      agenda: Array.isArray(saved.agenda) && saved.agenda.length > 0
        ? saved.agenda
        : CONFERENCE_DEFAULTS.agenda,
      emailTemplates: {
        general: {
          ...CONFERENCE_DEFAULTS.emailTemplates.general,
          ...(saved.emailTemplates?.general ?? {}),
        },
        reminder: {
          ...CONFERENCE_DEFAULTS.emailTemplates.reminder,
          ...(saved.emailTemplates?.reminder ?? {}),
        },
        directions: {
          ...CONFERENCE_DEFAULTS.emailTemplates.directions,
          ...(saved.emailTemplates?.directions ?? {}),
        },
      },
    }
  } catch {
    return CONFERENCE_DEFAULTS
  }
}

// ── Save settings ─────────────────────────────────────────────────────────────
export async function updateConferenceSettings(
  data: Partial<ConferenceSettings>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getConferenceSettings()
    const merged: ConferenceSettings = {
      ...current,
      ...data,
      emailTemplates: {
        general: {
          ...current.emailTemplates.general,
          ...(data.emailTemplates?.general ?? {}),
        },
        reminder: {
          ...current.emailTemplates.reminder,
          ...(data.emailTemplates?.reminder ?? {}),
        },
        directions: {
          ...current.emailTemplates.directions,
          ...(data.emailTemplates?.directions ?? {}),
        },
      },
    }
    const result = await updateSiteSetting(
      "conference_settings",
      merged as unknown as Record<string, unknown>,
    )
    if (result?.error) return { success: false, error: result.error }
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
