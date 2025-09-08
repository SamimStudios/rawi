import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const StyleGuideline = () => {
  const [cssVariables, setCssVariables] = useState({
    // Base Colors
    '--bg': '#0F1320',
    '--text': '#FFFFFF',
    '--accent-red': '#E5493F',
    '--grad-1': '#2F7BFF',
    '--grad-2': '#8A53F8',
    '--grad-3': '#FF5AA0',
    '--radius': '16px',

    // Semantic Colors (HSL)
    '--background': '217 29% 8%',
    '--foreground': '0 0% 100%',
    '--card': '217 29% 10%',
    '--card-foreground': '0 0% 100%',
    '--popover': '217 29% 10%',
    '--popover-foreground': '0 0% 100%',
    '--primary': '217 85% 59%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '217 29% 15%',
    '--secondary-foreground': '0 0% 100%',
    '--muted': '217 29% 15%',
    '--muted-foreground': '215 20% 65%',
    '--accent': '0 73% 57%',
    '--accent-foreground': '0 0% 100%',
    '--destructive': '0 73% 57%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '217 29% 20%',
    '--input': '217 29% 15%',
    '--ring': '217 85% 59%',

    // Sidebar Colors
    '--sidebar-background': '0 0% 98%',
    '--sidebar-foreground': '240 5.3% 26.1%',
    '--sidebar-primary': '240 5.9% 10%',
    '--sidebar-primary-foreground': '0 0% 98%',
    '--sidebar-accent': '240 4.8% 95.9%',
    '--sidebar-accent-foreground': '240 5.9% 10%',
    '--sidebar-border': '220 13% 91%',
    '--sidebar-ring': '217.2 91.2% 59.8%',
  });

  const [lightModeVariables, setLightModeVariables] = useState({
    '--background': '0 0% 100%',
    '--foreground': '222.2 84% 4.9%',
    '--card': '0 0% 100%',
    '--card-foreground': '222.2 84% 4.9%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222.2 84% 4.9%',
    '--primary': '217 91% 60%',
    '--primary-foreground': '210 40% 98%',
    '--secondary': '210 40% 96%',
    '--secondary-foreground': '222.2 47.4% 11.2%',
    '--muted': '210 40% 96%',
    '--muted-foreground': '215.4 16.3% 46.9%',
    '--accent': '45 93% 58%',
    '--accent-foreground': '220 13% 8%',
    '--destructive': '0 84% 60%',
    '--destructive-foreground': '210 40% 98%',
    '--border': '214.3 31.8% 91.4%',
    '--input': '214.3 31.8% 91.4%',
    '--ring': '217 91% 60%',
    '--sidebar-background': '240 5.9% 10%',
    '--sidebar-foreground': '240 4.8% 95.9%',
    '--sidebar-primary': '224.3 76.3% 48%',
    '--sidebar-primary-foreground': '0 0% 100%',
    '--sidebar-accent': '240 3.7% 15.9%',
    '--sidebar-accent-foreground': '240 4.8% 95.9%',
    '--sidebar-border': '240 3.7% 15.9%',
    '--sidebar-ring': '217.2 91.2% 59.8%',
  });

  const gradients = {
    '--gradient-primary': 'linear-gradient(135deg, var(--grad-1), var(--grad-2))',
    '--gradient-hero': 'linear-gradient(135deg, var(--bg), #1a2332)',
    '--gradient-cinematic': 'linear-gradient(135deg, var(--grad-1), var(--grad-2), var(--grad-3))',
  };

  const shadows = {
    '--shadow-soft': '0 4px 20px rgba(0, 0, 0, 0.1)',
    '--shadow-glow': '0 0 40px rgba(47, 123, 255, 0.3)',
  };

  const handleVariableChange = (key: string, value: string, isLightMode = false) => {
    if (isLightMode) {
      setLightModeVariables(prev => ({ ...prev, [key]: value }));
    } else {
      setCssVariables(prev => ({ ...prev, [key]: value }));
    }
    
    // Apply the change to CSS variables in real-time
    const root = document.documentElement;
    root.style.setProperty(key, value);
  };

  const applyChanges = () => {
    const root = document.documentElement;
    
    // Apply all dark mode variables
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    toast({
      title: "Changes Applied",
      description: "All style variables have been updated in real-time",
    });
  };

  const resetToDefaults = () => {
    // Reset to original values
    location.reload();
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to Clipboard",
      description: "CSS variables have been copied to your clipboard",
    });
  };

  const generateCSS = (variables: Record<string, string>, selector = ':root') => {
    const css = `${selector} {
${Object.entries(variables).map(([key, value]) => `  ${key}: ${value};`).join('\n')}
}`;
    return css;
  };

  const ColorPreview = ({ variable, value }: { variable: string, value: string }) => {
    const isHSL = !value.startsWith('#');
    const style = isHSL 
      ? { backgroundColor: `hsl(${value})` }
      : { backgroundColor: value };

    return (
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-8 h-8 rounded border border-border"
          style={style}
        />
        <div className="flex-1">
          <Label className="text-sm font-medium">{variable}</Label>
          <Input
            value={value}
            onChange={(e) => handleVariableChange(variable, e.target.value)}
            className="mt-1"
            placeholder="Enter color value"
          />
        </div>
      </div>
    );
  };

  const GradientPreview = ({ name, value }: { name: string, value: string }) => (
    <div className="mb-4">
      <Label className="text-sm font-medium">{name}</Label>
      <div 
        className="w-full h-16 rounded border border-border mt-2"
        style={{ background: value }}
      />
      <code className="text-xs text-muted-foreground mt-1 block">{value}</code>
    </div>
  );

  const ShadowPreview = ({ name, value }: { name: string, value: string }) => (
    <div className="mb-4">
      <Label className="text-sm font-medium">{name}</Label>
      <div 
        className="w-full h-16 bg-card rounded mt-2 flex items-center justify-center"
        style={{ boxShadow: value }}
      >
        <span className="text-sm text-muted-foreground">Shadow Preview</span>
      </div>
      <code className="text-xs text-muted-foreground mt-1 block">{value}</code>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Style Guideline</h1>
        <p className="text-muted-foreground">
          Comprehensive design system editor - modify and preview all CSS variables in real-time
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={applyChanges} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Apply Changes
        </Button>
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
        <Button 
          variant="outline" 
          onClick={() => copyToClipboard(generateCSS(cssVariables))}
          className="flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy Dark Mode CSS
        </Button>
        <Button 
          variant="outline" 
          onClick={() => copyToClipboard(generateCSS(lightModeVariables, '.light'))}
          className="flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy Light Mode CSS
        </Button>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="light">Light Mode</TabsTrigger>
          <TabsTrigger value="gradients">Gradients</TabsTrigger>
          <TabsTrigger value="shadows">Shadows</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Base Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <ColorPreview variable="--bg" value={cssVariables['--bg']} />
                <ColorPreview variable="--text" value={cssVariables['--text']} />
                <ColorPreview variable="--accent-red" value={cssVariables['--accent-red']} />
                <ColorPreview variable="--grad-1" value={cssVariables['--grad-1']} />
                <ColorPreview variable="--grad-2" value={cssVariables['--grad-2']} />
                <ColorPreview variable="--grad-3" value={cssVariables['--grad-3']} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Semantic Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <ColorPreview variable="--background" value={cssVariables['--background']} />
                <ColorPreview variable="--foreground" value={cssVariables['--foreground']} />
                <ColorPreview variable="--primary" value={cssVariables['--primary']} />
                <ColorPreview variable="--primary-foreground" value={cssVariables['--primary-foreground']} />
                <ColorPreview variable="--secondary" value={cssVariables['--secondary']} />
                <ColorPreview variable="--secondary-foreground" value={cssVariables['--secondary-foreground']} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>UI Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <ColorPreview variable="--muted" value={cssVariables['--muted']} />
                <ColorPreview variable="--muted-foreground" value={cssVariables['--muted-foreground']} />
                <ColorPreview variable="--accent" value={cssVariables['--accent']} />
                <ColorPreview variable="--accent-foreground" value={cssVariables['--accent-foreground']} />
                <ColorPreview variable="--border" value={cssVariables['--border']} />
                <ColorPreview variable="--input" value={cssVariables['--input']} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="light" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Light Mode Colors</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(lightModeVariables).slice(0, 8).map(([key, value]) => (
                  <ColorPreview 
                    key={key} 
                    variable={key} 
                    value={value} 
                  />
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Light Mode UI</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(lightModeVariables).slice(8, 16).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: `hsl(${value})` }}
                    />
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{key}</Label>
                      <Input
                        value={value}
                        onChange={(e) => handleVariableChange(key, e.target.value, true)}
                        className="mt-1"
                        placeholder="Enter HSL value"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gradients" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gradients</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(gradients).map(([name, value]) => (
                  <GradientPreview key={name} name={name} value={value} />
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shadows" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Shadows</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(shadows).map(([name, value]) => (
                  <ShadowPreview key={name} name={name} value={value} />
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Component Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="destructive">Destructive Button</Button>
                <Input placeholder="Input field" />
                <div className="p-4 bg-card rounded-md border">
                  <h3 className="font-semibold mb-2">Card Component</h3>
                  <p className="text-muted-foreground">This is how cards look with current colors</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export CSS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Dark Mode CSS Variables</Label>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto mt-2">
                      {generateCSS(cssVariables)}
                    </pre>
                  </div>
                  <div>
                    <Label>Light Mode CSS Variables</Label>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto mt-2">
                      {generateCSS(lightModeVariables, '.light')}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StyleGuideline;