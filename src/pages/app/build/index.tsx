import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Settings, Database, Workflow, FileText, Boxes } from 'lucide-react';

const buildTools = [
  {
    title: 'Fields',
    description: 'Create and manage form fields with validation rules and UI configuration',
    icon: <Settings className="w-6 h-6" />,
    href: '/app/build/field',
    color: 'text-blue-600'
  },
  {
    title: 'Node Library',
    description: 'Build reusable node definitions for forms, media, and groups',
    icon: <Boxes className="w-6 h-6" />,
    href: '/app/build/node',
    color: 'text-indigo-600'
  },
  {
    title: 'Schemas',
    description: 'Design database schemas and relationships',
    icon: <Database className="w-6 h-6" />,
    href: '/app/build/schema',
    color: 'text-green-600',
    disabled: true
  },
  {
    title: 'Workflows',
    description: 'Build automated workflows and business logic',
    icon: <Workflow className="w-6 h-6" />,
    href: '/app/build/workflow',
    color: 'text-purple-600',
    disabled: true
  },
  {
    title: 'Templates',
    description: 'Create reusable templates and components',
    icon: <FileText className="w-6 h-6" />,
    href: '/app/build/template',
    color: 'text-orange-600'
  }
];

export default function BuildIndex() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Build Tools</h1>
        <p className="text-muted-foreground">
          Create and manage the building blocks of your application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildTools.map((tool) => (
          <Card key={tool.title} className={`hover:shadow-lg transition-shadow ${tool.disabled ? 'opacity-50' : ''}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={tool.color}>
                  {tool.icon}
                </div>
                <CardTitle className="text-xl">{tool.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {tool.description}
              </p>
              {tool.disabled ? (
                <Button disabled className="w-full">
                  Coming Soon
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to={tool.href}>
                    Open {tool.title}
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