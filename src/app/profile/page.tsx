
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider"; // Example: Show theme setting

export default function UserProfilePage() {
  const { theme, accessibility } = useTheme();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserCircle className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">User Profile</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Manage your account settings and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                User authentication and detailed profile management are coming soon!
              </p>
              <p className="mt-2">
                For now, you can manage application-wide settings like theme and accessibility options using the settings cog.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Current Settings Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Theme:</strong> <span className="capitalize">{theme}</span></p>
              <p><strong>Large Text:</strong> {accessibility.largeText ? "Enabled" : "Disabled"}</p>
              <p><strong>High Contrast:</strong> {accessibility.highContrast ? "Enabled" : "Disabled"}</p>
              <p><strong>Text-to-Speech:</strong> {accessibility.textToSpeech ? "Enabled" : "Disabled"}</p>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
}

// Removed metadata export as it's not allowed in client components
// export const metadata = {
//   title: "User Profile",
//   description: "Manage your MindMash user profile and settings.",
// };

