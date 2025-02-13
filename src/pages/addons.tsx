import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Star, Users, Search } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/components/ui/use-toast";
import { type Theme } from "@/lib/theme-store";
import { PROJECT_TEMPLATES, type BoardTemplate } from '@/lib/templates';
import { useState } from "react";

// Sample data - in a real app, this would come from an API
const templates = PROJECT_TEMPLATES;

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

function AddOnCard({ item, onInstall }: { item: any; onInstall?: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{item.title || item.name}</span>
          <Button variant="ghost" size="sm" onClick={onInstall}>
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
        </CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">
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
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
          Discover and install community-created templates, themes, and integrations.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Input
          placeholder="Search add-ons..."
          className="max-w-sm"
        />
        <Button asChild>
          <a 
            href="https://github.com/NubsCarson/SupaKan/blob/main/CONTRIBUTING.md" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Submit Add-on
          </a>
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] w-full rounded-md border mt-4 p-4">
          <TabsContent value="templates" className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    className="pl-9"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                  />
                </div>
                <Tabs defaultValue="all" className="w-[600px]">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all" onClick={() => setSelectedCategory("all")}>All</TabsTrigger>
                    <TabsTrigger value="development" onClick={() => setSelectedCategory("development")}>Dev</TabsTrigger>
                    <TabsTrigger value="business" onClick={() => setSelectedCategory("business")}>Business</TabsTrigger>
                    <TabsTrigger value="design" onClick={() => setSelectedCategory("design")}>Design</TabsTrigger>
                    <TabsTrigger value="finance" onClick={() => setSelectedCategory("finance")}>Finance</TabsTrigger>
                    <TabsTrigger value="personal" onClick={() => setSelectedCategory("personal")}>Personal</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {templates
                  .filter(template => {
                    // Filter by search query
                    const searchMatch = templateSearch.trim() === '' || 
                      template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                      template.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
                      template.tasks.some(task => 
                        task.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
                        task.description.toLowerCase().includes(templateSearch.toLowerCase())
                      );

                    // Filter by category
                    const categoryMatch = selectedCategory === 'all' || 
                      (selectedCategory === 'development' && ['web-development'].includes(template.id)) ||
                      (selectedCategory === 'business' && ['marketing-campaign', 'product-launch'].includes(template.id)) ||
                      (selectedCategory === 'design' && ['product-design'].includes(template.id)) ||
                      (selectedCategory === 'finance' && ['finance-management'].includes(template.id)) ||
                      (selectedCategory === 'personal' && ['personal-tasks'].includes(template.id));

                    return searchMatch && categoryMatch;
                  })
                  .map((template) => (
                    <Card key={template.id} className="cursor-pointer transition-all hover:border-primary relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardHeader className="space-y-0 pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{template.icon}</span>
                            {template.name}
                          </div>
                          <Button variant="secondary" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Install
                          </Button>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-muted-foreground">
                          Includes {template.tasks.length} predefined tasks
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Community Template</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {templates.filter(template => {
                const searchMatch = templateSearch.trim() === '' || 
                  template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                  template.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
                  template.tasks.some(task => 
                    task.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
                    task.description.toLowerCase().includes(templateSearch.toLowerCase())
                  );

                const categoryMatch = selectedCategory === 'all' || 
                  (selectedCategory === 'development' && ['web-development'].includes(template.id)) ||
                  (selectedCategory === 'business' && ['marketing-campaign', 'product-launch'].includes(template.id)) ||
                  (selectedCategory === 'design' && ['product-design'].includes(template.id)) ||
                  (selectedCategory === 'finance' && ['finance-management'].includes(template.id)) ||
                  (selectedCategory === 'personal' && ['personal-tasks'].includes(template.id));

                return searchMatch && categoryMatch;
              }).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No templates found matching your search criteria.</p>
                  <p>Try adjusting your search terms or category filter.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="themes" className="space-y-4">
            {themes.map((theme) => (
              <AddOnCard 
                key={theme.id} 
                item={theme} 
                onInstall={() => handleInstallTheme(theme)}
              />
            ))}
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <p>Integrations coming soon!</p>
              <p>Connect your tasks with your favorite tools and services.</p>
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <p>Automation add-ons coming soon!</p>
              <p>Create custom workflows and automate your tasks.</p>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
} 