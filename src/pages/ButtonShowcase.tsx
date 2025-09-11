import React from 'react';
import { Button } from '@/components/ui/button';
import { EditButton } from '@/components/ui/edit-button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const ButtonShowcase = () => {
  const buttonVariants = [
    { name: 'Default (Type 2 Blue)', variant: 'default' as const },
    { name: 'Destructive (Type 2 Red)', variant: 'destructive' as const },
    { name: 'Outline', variant: 'outline' as const },
    { name: 'Ghost (Type 4 Blue)', variant: 'ghost' as const },
    { name: 'Link', variant: 'link' as const },
    { name: 'Primary (Type 1)', variant: 'primary' as const },
    { name: 'Type 3 Blue', variant: 'type_3_blue' as const },
    { name: 'Type 3 Red', variant: 'type_3_red' as const },
    { name: 'Type 4 Red', variant: 'type_4_red' as const },
  ];

  const sizes = [
    { name: 'Small', size: 'sm' as const },
    { name: 'Default', size: 'default' as const },
    { name: 'Large', size: 'lg' as const },
    { name: 'Icon', size: 'icon' as const },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Button Showcase - Consolidated System</h1>
      
      {/* All Variants */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>All Button Variants (Consolidated)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buttonVariants.map((variant) => (
              <div key={variant.name} className="flex flex-col items-center space-y-2 p-4 border rounded">
                <h3 className="text-sm font-medium text-center">{variant.name}</h3>
                <Button variant={variant.variant}>
                  Button Text
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* With Credits Display */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Buttons with Credit Display (Inside Button)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buttonVariants.map((variant) => (
              <div key={variant.name} className="flex flex-col items-center space-y-2 p-4 border rounded">
                <h3 className="text-sm font-medium text-center">{variant.name}</h3>
                <Button variant={variant.variant} showCredits={true}>
                  Button Text
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Different Sizes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Button Sizes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sizes.map((size) => (
              <div key={size.name} className="flex flex-col items-center space-y-2 p-4 border rounded">
                <h3 className="text-sm font-medium">{size.name}</h3>
                <Button variant="primary" size={size.size}>
                  {size.name !== 'Icon' ? size.name : '⭐'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive States */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Interactive States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center space-y-2 p-4 border rounded">
              <h3 className="text-sm font-medium">Normal</h3>
              <Button variant="primary">Click Me</Button>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 border rounded">
              <h3 className="text-sm font-medium">Disabled</h3>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 border rounded">
              <h3 className="text-sm font-medium">Disabled + Credits</h3>
              <Button variant="primary" disabled showCredits={true}>Disabled</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consolidated Type System */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Consolidated Type System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Type 1 - Primary */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Primary (Type 1 - Gradient)</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Generate Story</Button>
                <Button variant="primary" showCredits={true}>Generate Story</Button>
              </div>
            </div>

            {/* Type 2 - Solid Colors */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Type 2 (Solid Colors)</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default (Blue)</Button>
                <Button variant="destructive">Destructive (Red)</Button>
                <Button variant="default" showCredits={true}>Default + Credits</Button>
                <Button variant="destructive" showCredits={true}>Destructive + Credits</Button>
              </div>
            </div>

            {/* Type 3 - Outline */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Type 3 (Outline)</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="type_3_blue">Outline Blue</Button>
                <Button variant="type_3_red">Outline Red</Button>
                <Button variant="type_3_blue" showCredits={true}>Outline Blue + Credits</Button>
                <Button variant="type_3_red" showCredits={true}>Outline Red + Credits</Button>
              </div>
            </div>

            {/* Type 4 - Ghost */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Type 4 (Ghost)</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="ghost">Ghost Blue</Button>
                <Button variant="type_4_red">Ghost Red</Button>
                <Button variant="ghost" showCredits={true}>Ghost Blue + Credits</Button>
                <Button variant="type_4_red" showCredits={true}>Ghost Red + Credits</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-world Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Real-world Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 border rounded bg-card">
              <h3 className="text-lg font-semibold mb-4">Storyboard Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" showCredits={true}>Generate Storyboard</Button>
                <EditButton onClick={() => {}} variant="default" />
                <Button variant="type_3_blue">Save Progress</Button>
                <Button variant="ghost">Preview</Button>
              </div>
            </div>

            <div className="p-4 border rounded bg-card">
              <h3 className="text-lg font-semibold mb-4">Character Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" showCredits={true}>Regenerate Character</Button>
                <EditButton onClick={() => {}} variant="default" />
                <Button variant="type_3_red">Remove Character</Button>
                <Button variant="ghost">View Gallery</Button>
              </div>
            </div>

            <div className="p-4 border rounded bg-card">
              <h3 className="text-lg font-semibold mb-4">Navigation & Forms</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Submit</Button>
                <Button variant="outline">Cancel</Button>
                <Button variant="outline">Back</Button>
                <Button variant="ghost">Skip</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ButtonShowcase;