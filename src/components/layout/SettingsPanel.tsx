
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
import { Moon, Sun, Laptop, Text, Contrast, Volume2, VolumeX } from "lucide-react";
import type { Theme } from "@/providers/ThemeProvider";

export function SettingsPanel() {
  const { theme, setTheme, accessibility, toggleLargeText, toggleHighContrast, toggleTextToSpeech } = useTheme();

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="theme-select" className="text-base font-semibold">Theme</Label>
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

      <div className="space-y-2">
        <h3 className="text-base font-semibold mb-3">Accessibility</h3>
        <div className="flex items-center justify-between p-3 rounded-md border">
          <Label htmlFor="large-text-switch" className="flex items-center gap-2 cursor-pointer">
            <Text className="h-5 w-5" />
            Large Text
          </Label>
          <Switch
            id="large-text-switch"
            checked={accessibility.largeText}
            onCheckedChange={toggleLargeText}
            aria-label="Toggle large text mode"
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-md border">
          <Label htmlFor="high-contrast-switch" className="flex items-center gap-2 cursor-pointer">
            <Contrast className="h-5 w-5" />
            High Contrast
          </Label>
          <Switch
            id="high-contrast-switch"
            checked={accessibility.highContrast}
            onCheckedChange={toggleHighContrast}
            aria-label="Toggle high contrast mode"
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-md border">
          <Label htmlFor="tts-switch" className="flex items-center gap-2 cursor-pointer">
            {accessibility.textToSpeech ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            Text-to-Speech
          </Label>
          <Switch
            id="tts-switch"
            checked={accessibility.textToSpeech}
            onCheckedChange={toggleTextToSpeech}
            aria-label="Toggle text to speech"
          />
        </div>
        <p className="text-xs text-muted-foreground px-1">
          Note: Text-to-Speech is a basic implementation and may depend on browser support. High contrast mode provides a simplified high-contrast theme.
        </p>
      </div>
    </div>
  );
}
