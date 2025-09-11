import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const ButtonShowcase = () => {
  const buttonVariants = [
    { name: 'Default', variant: 'default' as const },
    { name: 'Destructive', variant: 'destructive' as const },
    { name: 'Outline', variant: 'outline' as const },
    { name: 'Secondary', variant: 'secondary' as const },
    { name: 'Ghost', variant: 'ghost' as const },
    { name: 'Link', variant: 'link' as const },
    { name: 'Primary', variant: 'primary' as const },
    { name: 'Type 1', variant: 'type_1' as const },
    { name: 'Type 2 Blue', variant: 'type_2_blue' as const },
    { name: 'Type 2 Red', variant: 'type_2_red' as const },
    { name: 'Type 3 Blue', variant: 'type_3_blue' as const },
    { name: 'Type 3 Red', variant: 'type_3_red' as const },
    { name: 'Type 4 Blue', variant: 'type_4_blue' as const },
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
      <h1 className="text-3xl font-bold mb-8">Button Showcase</h1>
      
      {/* All Variants */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>All Button Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buttonVariants.map((variant) => (
              <div key={variant.name} className="flex flex-col items-center space-y-2 p-4 border rounded">
                <h3 className="text-sm font-medium">{variant.name}</h3>
                <Button variant={variant.variant}>
                  {variant.name}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* With Credits Display */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Buttons with Credit Display</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buttonVariants.slice(0, 6).map((variant) => (
              <div key={variant.name} className="flex flex-col items-center space-y-2 p-4 border rounded">
                <h3 className="text-sm font-medium">{variant.name} + Credits</h3>
                <Button variant={variant.variant} showCredits={true}>
                  {variant.name}
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
              <Button variant="type_1">Click Me</Button>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 border rounded">
              <h3 className="text-sm font-medium">Disabled</h3>
              <Button variant="type_1" disabled>Disabled</Button>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 border rounded">
              <h3 className="text-sm font-medium">Disabled + Credits</h3>
              <Button variant="type_1" disabled showCredits={true}>Disabled</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color System Test */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>New Type System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Type 1 - Gradient Primary */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Type 1 (Gradient Primary)</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="type_1">Generate Story</Button>
                <Button variant="type_1" showCredits={true}>Generate Story</Button>
              </div>
            </div>

            {/* Type 2 - Solid Colors */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Type 2 (Solid Colors)</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="type_2_blue">Edit Details</Button>
                <Button variant="type_2_red">Delete Item</Button>
                <Button variant="type_2_blue" showCredits={true}>Edit Details</Button>
                <Button variant="type_2_red" showCredits={true}>Delete Item</Button>
              </div>
            </div>

            {/* Type 3 - Outline */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Type 3 (Outline)</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="type_3_blue">Save Draft</Button>
                <Button variant="type_3_red">Cancel</Button>
                <Button variant="type_3_blue" showCredits={true}>Save Draft</Button>
                <Button variant="type_3_red" showCredits={true}>Cancel</Button>
              </div>
            </div>

            {/* Type 4 - Ghost */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Type 4 (Ghost)</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="type_4_blue">View More</Button>
                <Button variant="type_4_red">Hide</Button>
                <Button variant="type_4_blue" showCredits={true}>View More</Button>
                <Button variant="type_4_red" showCredits={true}>Hide</Button>
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
                <Button variant="type_1" showCredits={true}>Generate Storyboard</Button>
                <Button variant="type_2_blue">Edit Settings</Button>
                <Button variant="type_3_blue">Save Progress</Button>
                <Button variant="type_4_blue">Preview</Button>
              </div>
            </div>

            <div className="p-4 border rounded bg-card">
              <h3 className="text-lg font-semibold mb-4">Character Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="type_1" showCredits={true}>Regenerate Character</Button>
                <Button variant="type_2_blue">Edit Details</Button>
                <Button variant="type_3_red">Remove Character</Button>
                <Button variant="type_4_blue">View Gallery</Button>
              </div>
            </div>

            <div className="p-4 border rounded bg-card">
              <h3 className="text-lg font-semibold mb-4">Navigation & Forms</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Submit</Button>
                <Button variant="secondary">Cancel</Button>
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