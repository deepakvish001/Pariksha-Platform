import { describe, it, expect } from "vitest";
import { achievements } from "@/components/AchievementBadge";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, "..", "..", p), "utf8");

describe("roadmap feature removal — no empty rows", () => {
  it("achievements list contains no roadmap-related badges", () => {
    const offenders = achievements.filter((a) =>
      /roadmap/i.test(`${a.name} ${a.description} ${a.id}`)
    );
    expect(offenders).toEqual([]);
  });

  it("achievements list still has badges and no empty entries", () => {
    expect(achievements.length).toBeGreaterThan(0);
    for (const a of achievements) {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(a.requirement?.type).toBeTruthy();
    }
  });

  it("Onboarding page source has no roadmap references", () => {
    expect(/roadmap/i.test(read("src/pages/Onboarding.tsx"))).toBe(false);
  });

  it("Settings tabs have no roadmap references", () => {
    const files = [
      "src/pages/Settings.tsx",
      "src/components/settings/SettingsAccountTab.tsx",
      "src/components/settings/SettingsLearningTab.tsx",
      "src/components/settings/SettingsNotificationsTab.tsx",
      "src/components/settings/SettingsProfileTab.tsx",
      "src/components/settings/SettingsSecurityTab.tsx",
    ];
    for (const f of files) {
      expect(/roadmap/i.test(read(f)), `${f} mentions roadmap`).toBe(false);
    }
  });

  it("Achievements page source has no roadmap references", () => {
    expect(/roadmap/i.test(read("src/pages/Achievements.tsx"))).toBe(false);
  });
});
