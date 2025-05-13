
export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
};

export const siteConfig: SiteConfig = {
  name: "MindMash",
  description: "Generate and take AI-powered quizzes on any topic.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", // Ensure NEXT_PUBLIC_APP_URL is set in .env
  ogImage: "/og-image.png", // Add an OpenGraph image later if needed
};
