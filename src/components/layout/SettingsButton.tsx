"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { SettingsPanel } from "./SettingsPanel";

export function SettingsButton() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50"
          aria-label="Open settings panel"
        >
          <Settings className="h-6 w-6 settings-icon-glow" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[350px] sm:w-[400px]">
        <SheetHeader className="mb-6">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Customize your experience. Changes are saved automatically.
          </SheetDescription>
        </SheetHeader>
        <SettingsPanel />
      </SheetContent>
    </Sheet>
  );
}
