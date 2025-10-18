import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Globe, Wallet, Menu, X, User, LogOut } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const Header = () => {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { user, signOut } = useAuth();
  const { credits } = useUserCredits();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoSrc = language === 'ar' 
    ? "/brand/logo-lockup-ar-horizontal.svg" 
    : "/brand/logo-lockup-en-horizontal.svg";

  const navItems = user ? [
    { key: 'templates', href: '/templates', label: undefined },
    { key: 'wallet', href: '/user/wallet', label: undefined },
  ] : [
    { key: 'templates', href: '/templates', label: undefined },
    { key: 'tryFree', href: '/try/cinematic-teaser', label: undefined },
    { key: 'help', href: '/help', label: undefined },
  ];

  const walletCredits = user ? (credits.credits || 0).toFixed(2) : '0.00';

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={logoSrc}
              alt={t('rawiApp')} 
              className="h-8 md:h-10"
            />
          </Link>

          {/* Center Navigation (Desktop) */}
          <nav className={cn("hidden md:flex items-center", isRTL ? "space-x-reverse space-x-8" : "space-x-8")}>
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {item.label || t(item.key)}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-4" : "space-x-4")}>
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
            <Link to={user ? "/user/usage" : "/auth/sign-in"}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{walletCredits} {t('credits')}</span>
              </Button>
            </Link>

            {/* User Menu or Sign In */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border border-border shadow-cinematic z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/app" className="cursor-pointer">{t('dashboard')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/user/settings" className="cursor-pointer">{t('settings')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="cursor-pointer text-destructive"
                  >
                    <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                    {t('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="type_3_blue" size="sm" className="hidden sm:flex" asChild>
                <Link to="/auth/sign-in">
                  {t('signIn')}
                </Link>
              </Button>
            )}

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
          <div className="md:hidden py-4 border-t border-border bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  className="text-foreground hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label || t(item.key)}
                </Link>
              ))}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Link to={user ? "/user/usage" : "/auth/sign-in"}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{walletCredits} {t('credits')}</span>
                  </Button>
                </Link>
                {user ? (
                  <Button variant="type_3_blue" size="sm" asChild>
                    <Link to="/user/settings">{t('settings')}</Link>
                  </Button>
                ) : (
                  <Button variant="type_3_blue" size="sm" asChild>
                    <Link to="/auth/sign-in">{t('signIn')}</Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;