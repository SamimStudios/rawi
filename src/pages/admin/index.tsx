import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Settings, Beaker, Shield } from 'lucide-react';

const adminSections = [
  {
    title: 'Build Tools',
    description: 'Create and manage fields, nodes, templates, and workflows',
    icon: <Settings className="w-6 h-6" />,
    href: '/admin/build',
    color: 'text-blue-600'
  },
  {
    title: 'Demo Pages',
    description: 'Test and preview features like i18n, SEO, analytics, and components',
    icon: <Beaker className="w-6 h-6" />,
    href: '/admin/demo',
    color: 'text-purple-600'
  },
  {
    title: 'System Management',
    description: 'Database administration, user management, and system configuration',
    icon: <Shield className="w-6 h-6" />,
    href: '/admin/system',
    color: 'text-red-600',
    disabled: true
  }
];

export default function AdminIndex() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage system configuration, build tools, and testing utilities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Card key={section.title} className={`hover:shadow-lg transition-shadow ${section.disabled ? 'opacity-50' : ''}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={section.color}>
                  {section.icon}
                </div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {section.description}
              </p>
              {section.disabled ? (
                <Button disabled className="w-full">
                  Coming Soon
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to={section.href}>
                    Open {section.title}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
