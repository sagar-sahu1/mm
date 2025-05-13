
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, LogOut, Loader2 } from "lucide-react"; // Added Loader2
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/providers/ThemeProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
// Removed Link import as it's not used

export default function UserProfilePage() {
  const { currentUser, logout, loading } = useAuth();
  const { theme, accessibility } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/profile');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p>Loading profile...</p>
      </div>
    );
  }

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
            <CardContent className="space-y-2">
              <p><strong>Email:</strong> {currentUser.email || "Not available"}</p>
              <p><strong>User ID:</strong> {currentUser.uid}</p>
              {/* Add more user details if available, e.g., currentUser.displayName */}
              <p className="text-muted-foreground mt-2">
                More profile management features (like changing password, updating display name) are coming soon!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Current App Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Theme:</strong> <span className="capitalize">{theme}</span></p>
              <p><strong>Large Text:</strong> {accessibility.largeText ? "Enabled" : "Disabled"}</p>
              <p><strong>High Contrast:</strong> {accessibility.highContrast ? "Enabled" : "Disabled"}</p>
              <p><strong>Text-to-Speech:</strong> {accessibility.textToSpeech ? "Enabled" : "Disabled"}</p>
              <p className="text-muted-foreground mt-1">
                These settings can be changed using the settings cog.
              </p>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="p-6 md:p-8">
          <Button onClick={logout} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
// Removed metadata export as it's not allowed in client components
// export const metadata = {
//   title: "User Profile",
//   description: "Manage your MindMash user profile and settings.",
// };
