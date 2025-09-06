import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Globe, Wallet, Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoSrc = language === 'ar' 
    ? "/brand/logo-rawi-ar-gradient.svg" 
    : "/brand/logo-rawi-en-gradient.svg";

  const navItems = [
    { key: 'templates', href: '/templates' },
    { key: 'tryFree', href: '/try/cinematic-teaser' },
    { key: 'help', href: '/help' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={logoSrc}
              alt="Rawi App" 
              className="h-8 md:h-10"
            />
          </Link>

          {/* Center: Navigation (Desktop) */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">{language.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border border-border shadow-cinematic z-50">
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className={cn("cursor-pointer", language === 'en' && "bg-accent")}
                >
                  English
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('ar')}
                  className={cn("cursor-pointer", language === 'ar' && "bg-accent")}
                >
                  العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Wallet */}
            <div className="hidden sm:flex items-center gap-2 bg-secondary rounded-full px-3 py-1">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">0 {t('credits')}</span>
            </div>

            {/* Sign In */}
            <Button variant="outline" size="sm" className="hidden sm:flex">
              {t('signIn')}
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  className="text-foreground hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t(item.key)}
                </Link>
              ))}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">0 {t('credits')}</span>
                </div>
                <Button variant="outline" size="sm">
                  {t('signIn')}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;