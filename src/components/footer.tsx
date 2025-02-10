import { Github, Twitter, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    {
      icon: Github,
      href: 'https://github.com/NubsCarson',
      label: 'GitHub',
    },
    {
      icon: Twitter,
      href: 'https://twitter.com/MoneroSolana',
      label: 'Twitter',
    },
    {
      icon: MessageCircle,
      href: 'https://discord.com/users/1284887060825509890',
      label: 'Discord',
    },
    {
      icon: Send,
      href: 'https://t.me/ChillWeb3Dev',
      label: 'Telegram',
    },
  ];

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <p className="text-sm text-muted-foreground">
          © {currentYear} Kanban Board. All rights reserved.
        </p>
        <div className="flex items-center space-x-1">
          {socialLinks.map(({ icon: Icon, href, label }) => (
            <Button
              key={label}
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              asChild
            >
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            </Button>
          ))}
        </div>
      </div>
    </footer>
  );
} 