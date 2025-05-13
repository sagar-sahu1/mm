
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from 'date-fns';

import { useAuth } from "@/contexts/AuthContext";
// useTheme removed as current app settings section is removed
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Label removed as it's implicitly used by FormLabel
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, LogOut, Loader2, CalendarIcon, UploadCloud, Github, Linkedin, Instagram, Save } from "lucide-react"; // Added Save icon
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, updateUserProfile, createUserProfileDocument } from "@/lib/firestoreUtils";
import { getAppStorage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import type { UserProfileFirestoreData, SocialLinks } from "@/types";
import { updateProfile as updateAuthProfile } from "firebase/auth";


const profileFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters.").max(50, "Display name too long."),
  photoFile: z.instanceof(File).optional().nullable(),
  bio: z.string().max(300, "Bio too long.").optional(),
  birthdate: z.date().optional().nullable(),
  socialLinks: z.object({
    github: z.string().url("Invalid URL").optional().or(z.literal('')),
    linkedin: z.string().url("Invalid URL").optional().or(z.literal('')),
    instagram: z.string().url("Invalid URL").optional().or(z.literal('')),
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UserProfilePage() {
  const { currentUser, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      photoFile: null,
      bio: "",
      birthdate: null,
      socialLinks: { github: "", linkedin: "", instagram: "" },
    },
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login?redirect=/profile');
    } else if (currentUser) {
      setIsProfileLoading(true);
      getUserProfile(currentUser.uid)
        .then((profileData) => {
          if (profileData) {
            form.reset({
              displayName: profileData.displayName || currentUser.displayName || "",
              bio: profileData.bio || "",
              birthdate: profileData.birthdate ? parseISO(profileData.birthdate) : null,
              socialLinks: profileData.socialLinks || { github: "", linkedin: "", instagram: "" },
              photoFile: null,
            });
            setPhotoPreview(profileData.photoURL || currentUser.photoURL || null);
          } else {
            form.reset({
              displayName: currentUser.displayName || "",
              bio: "",
              birthdate: null,
              socialLinks: { github: "", linkedin: "", instagram: "" },
              photoFile: null,
            });
            setPhotoPreview(currentUser.photoURL || null);
          }
        })
        .catch(error => {
          console.error("Error fetching profile:", error);
          toast({ title: "Error", description: "Could not load profile data.", variant: "destructive" });
           form.reset({ 
              displayName: currentUser.displayName || "",
              bio: "",
              birthdate: null,
              socialLinks: { github: "", linkedin: "", instagram: "" },
              photoFile: null,
            });
            setPhotoPreview(currentUser.photoURL || null);
        })
        .finally(() => setIsProfileLoading(false));
    }
  }, [currentUser, authLoading, router, form, toast]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      form.setValue("photoFile", file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!currentUser) return;
    setIsLoading(true);

    let newPhotoURL = photoPreview;

    try {
      if (data.photoFile) {
        const storage = getAppStorage();
        const filePath = `profile-pictures/${currentUser.uid}/${data.photoFile.name}`;
        const fileRef = storageRef(storage, filePath);
        await uploadBytes(fileRef, data.photoFile);
        newPhotoURL = await getDownloadURL(fileRef);
      }

      const firestoreData: UserProfileFirestoreData = {
        displayName: data.displayName,
        photoURL: newPhotoURL || undefined,
        bio: data.bio || "",
        birthdate: data.birthdate ? format(data.birthdate, 'yyyy-MM-dd') : undefined,
        socialLinks: data.socialLinks,
        email: currentUser.email || undefined,
      };
      
      const existingProfile = await getUserProfile(currentUser.uid);
      if (existingProfile) {
        await updateUserProfile(currentUser.uid, firestoreData);
      } else {
        await createUserProfileDocument(currentUser.uid, { 
          ...firestoreData, 
          createdAt: Date.now(), 
          updatedAt: Date.now() 
        });
      }

      const authUpdates: { displayName?: string; photoURL?: string } = {};
      if (data.displayName !== currentUser.displayName) {
        authUpdates.displayName = data.displayName;
      }
      if (newPhotoURL && newPhotoURL !== (currentUser.photoURL || photoPreview)) {
        authUpdates.photoURL = newPhotoURL;
      }
      if (Object.keys(authUpdates).length > 0 && currentUser) {
         await updateAuthProfile(currentUser, authUpdates);
      }
      
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: (error as Error).message || "Could not update profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isProfileLoading || !currentUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <Avatar className="h-24 w-24 ring-4 ring-primary ring-offset-2 ring-offset-background">
              <AvatarImage src={photoPreview || undefined} alt={currentUser.displayName || "User"} />
              <AvatarFallback>
                <UserCircle className="h-16 w-16" />
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-3xl font-bold">User Profile</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Manage your account settings and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="photoFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Profile Picture</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                         <Input
                          id="photoFile"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="flex-grow"
                        />
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormDescription>Upload a new profile picture (max 2MB).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormItem>
                <FormLabel className="text-lg">Email</FormLabel>
                <Input type="email" value={currentUser.email || "Not available"} readOnly disabled className="bg-muted/50" />
                <FormDescription>Your email address cannot be changed here.</FormDescription>
              </FormItem>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Bio (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us a bit about yourself..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-lg mb-1">Date of Birth (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => field.onChange(date)}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Social Links (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="socialLinks.github"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Github className="h-5 w-5"/> GitHub URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://github.com/yourusername" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialLinks.linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Linkedin className="h-5 w-5"/> LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialLinks.instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Instagram className="h-5 w-5"/> Instagram URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/yourusername" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Button type="submit" size="default" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="p-6 md:p-8 flex-col space-y-4">
          {/* Removed Current App Settings Card */}
          <Button onClick={logout} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
