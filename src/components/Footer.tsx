import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { language, t } = useLanguage();

  const logoSrc = language === 'ar' 
    ? "/brand/logo-lockup-ar-vertical.svg" 
    : "/brand/logo-lockup-en-vertical.svg";

  const footerLinks = [
    { key: 'terms', href: '/legal/terms' },
    { key: 'privacy', href: '/legal/privacy' },
    { key: 'consent', href: '/legal/consent' },
    { key: 'refund', href: '/legal/refund' },
    { key: 'help', href: '/help' },
  ];

  return (
    <footer className="bg-[#0F1320] text-white border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="block">
              <img 
                src={logoSrc}
                alt="Rawi App" 
                className="h-20 md:h-24"
              />
            </Link>
          </div>

          {/* Right: Links */}
          <nav className="flex flex-wrap items-center gap-6 md:gap-8">
            {footerLinks.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className="text-white/80 hover:text-white transition-colors font-medium"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Company Copyright Section */}
        <div className="border-t border-white/10 mt-8 pt-6">
          <div className="text-center text-white/60 text-sm">
            <p className="mb-2">
              {language === 'ar' 
                ? 'تطبيق راوي مملوك ومُشغل من قِبل' 
                : 'Rawi is owned and operated by'}
            </p>
            <p className="font-medium text-white/80">
              ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة (SAMIM STUDIOS L.L.C-FZ)
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;