import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Languages, Search, Settings, BarChart, Play, Palette, Square } from 'lucide-react';

const demoPages = [
  {
    title: 'i18n Demo',
    description: 'Test internationalization and language switching',
    icon: <Languages className="w-6 h-6" />,
    href: '/admin/demo/i18n',
    color: 'text-blue-600'
  },
  {
    title: 'SEO Demo',
    description: 'Preview SEO meta tags and configurations',
    icon: <Search className="w-6 h-6" />,
    href: '/admin/demo/seo',
    color: 'text-green-600'
  },
  {
    title: 'Config Demo',
    description: 'Test application configuration system',
    icon: <Settings className="w-6 h-6" />,
    href: '/admin/demo/config',
    color: 'text-purple-600'
  },
  {
    title: 'Analytics Demo',
    description: 'Test analytics tracking and events',
    icon: <BarChart className="w-6 h-6" />,
    href: '/admin/demo/analytics',
    color: 'text-orange-600'
  },
  {
    title: 'Media Player Demo',
    description: 'Test media playback functionality',
    icon: <Play className="w-6 h-6" />,
    href: '/admin/demo/media-player',
    color: 'text-red-600'
  },
  {
    title: 'Style Guideline',
    description: 'View design system and component styles',
    icon: <Palette className="w-6 h-6" />,
    href: '/admin/demo/style-guideline',
    color: 'text-pink-600'
  },
  {
    title: 'Button Showcase',
    description: 'Preview all button variants and states',
    icon: <Square className="w-6 h-6" />,
    href: '/admin/demo/button-showcase',
    color: 'text-indigo-600'
  }
];

export default function DemoIndex() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Demo Pages</h1>
        <p className="text-muted-foreground">
          Test and preview various features and components
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoPages.map((demo) => (
          <Card key={demo.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={demo.color}>
                  {demo.icon}
                </div>
                <CardTitle className="text-xl">{demo.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {demo.description}
              </p>
              <Button asChild className="w-full">
                <Link to={demo.href}>
                  Open Demo
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
