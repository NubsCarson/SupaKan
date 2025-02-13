import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Users } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/components/ui/use-toast";
import { type Theme } from "@/lib/theme-store";
import { type VariantProps } from "class-variance-authority";

type AddOnItem = {
  id: string;
  name: string;
  title?: string;
  description: string;
  tags: string[];
  author: string;
};

const themes: (Theme & { author: string })[] = [
  {
    id: "nord-theme",
    name: "Nord Theme",
    description: "A clean and modern theme inspired by the Nord color palette.",
    author: "Nubs Carson",
    tags: ["dark", "minimal", "professional"],
    colors: {
      background: "220 16% 22%",
      foreground: "220 16% 90%",
      card: "220 16% 24%",
      cardForeground: "220 16% 90%",
      popover: "220 16% 24%",
      popoverForeground: "220 16% 90%",
      primary: "220 16% 90%",
      primaryForeground: "220 16% 16%",
      secondary: "220 16% 28%",
      secondaryForeground: "220 16% 90%",
      muted: "220 16% 28%",
      mutedForeground: "220 16% 80%",
      accent: "220 16% 28%",
      accentForeground: "220 16% 90%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "220 16% 90%",
      border: "220 16% 28%",
      input: "220 16% 28%",
      ring: "220 16% 83%",
    },
  },
  {
    id: "synthwave-theme",
    name: "Synthwave",
    description: "Retro-futuristic theme with vibrant neon colors.",
    author: "Nubs Carson",
    tags: ["dark", "colorful", "retro"],
    colors: {
      background: "280 50% 10%",
      foreground: "280 100% 90%",
      card: "280 50% 12%",
      cardForeground: "280 100% 90%",
      popover: "280 50% 12%",
      popoverForeground: "280 100% 90%",
      primary: "320 100% 60%",
      primaryForeground: "280 50% 10%",
      secondary: "280 50% 15%",
      secondaryForeground: "280 100% 90%",
      muted: "280 50% 15%",
      mutedForeground: "280 50% 80%",
      accent: "320 100% 60%",
      accentForeground: "280 50% 10%",
      destructive: "0 100% 40%",
      destructiveForeground: "280 100% 90%",
      border: "280 50% 15%",
      input: "280 50% 15%",
      ring: "320 100% 60%",
    },
  },
];

function AddOnCard({ item, onInstall }: { item: AddOnItem; onInstall?: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{item.title || item.name}</span>
          <Button className={buttonVariants({ variant: "ghost", size: "sm" })} onClick={onInstall}>
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
        </CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags.map((tag: string) => (
            <Badge key={tag} className={badgeVariants({ variant: "secondary" })}>
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{item.author}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function AddonsPage() {
  const { addCustomTheme, customThemes } = useTheme();
  const { toast } = useToast();

  const handleInstallTheme = (theme: Theme) => {
    const isInstalled = customThemes.some((t) => t.id === theme.id);
    if (isInstalled) {
      toast({
        title: "Theme already installed",
        description: "This theme is already installed in your workspace.",
      });
      return;
    }

    addCustomTheme(theme);
    toast({
      title: "Theme installed",
      description: "You can now select this theme from the theme switcher.",
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Add-ons</h1>
        <p className="text-muted-foreground">
          Discover and install community-created themes, integrations, and automation tools.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Input
          placeholder="Search add-ons..."
          className="max-w-sm"
        />
        <Button className={buttonVariants({ variant: "default" })} asChild>
          <a 
            href="https://github.com/NubsCarson/SupaKan/blob/main/CONTRIBUTING.md" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Submit Add-on
          </a>
        </Button>
      </div>

      <Tabs defaultValue="themes" className="w-full">
        <TabsList>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] w-full rounded-md border mt-4 p-4">
          <TabsContent value="themes" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {themes.map((theme) => (
                <AddOnCard
                  key={theme.id}
                  item={theme}
                  onInstall={() => handleInstallTheme(theme)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              Coming soon...
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              Coming soon...
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
} 