"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Moon, Sun, Laptop } from "lucide-react";
import type { Theme } from "@/providers/ThemeProvider";

export function SettingsPanel() {
  const { theme, setTheme, accessibility, toggleLargeText, toggleHighContrast, toggleTextToSpeech } = useTheme();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="theme-select">Theme</Label>
          <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
            <SelectTrigger id="theme-select" className="w-full">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" /> Light
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" /> Dark
                </div>
              </SelectItem>
              <SelectItem value="system">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" /> System
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Accessibility</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="large-text">Large Text</Label>
            <Switch
              id="large-text"
              checked={accessibility.largeText}
              onCheckedChange={toggleLargeText}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="high-contrast">High Contrast</Label>
            <Switch
              id="high-contrast"
              checked={accessibility.highContrast}
              onCheckedChange={toggleHighContrast}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="text-to-speech">Text to Speech</Label>
            <Switch
              id="text-to-speech"
              checked={accessibility.textToSpeech}
              onCheckedChange={toggleTextToSpeech}
            />
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Shortcut to toggle: Press <kbd className="px-1 py-0.5 border rounded bg-background text-foreground font-semibold">F</kbd> + <kbd className="px-1 py-0.5 border rounded bg-background text-foreground font-semibold">J</kbd> simultaneously during a quiz.
          </div>
        </div>
      </div>
    </div>
  );
}
