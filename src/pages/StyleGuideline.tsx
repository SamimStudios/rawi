import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Copy, Download, RefreshCw, AlertCircle, CheckCircle, Info, 
  Settings, User, Mail, Lock, Eye, EyeOff, Search, Plus, 
  Trash2, Edit, Save, X, Check, Star, Heart, Share, 
  Home, BarChart3, Bell, Calendar, Camera, Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const StyleGuideline = () => {
  // All CSS Variables from index.css
  const [cssVariables, setCssVariables] = useState({
    // Base Design System Colors (HEX)
    '--bg': '#0F1320',
    '--text': '#FFFFFF', 
    '--accent-red': '#E5493F',
    '--grad-1': '#2F7BFF',
    '--grad-2': '#8A53F8',
    '--grad-3': '#FF5AA0',
    '--radius': '8px',

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

  const gradients = {
    '--gradient-primary': 'linear-gradient(135deg, var(--grad-1), var(--grad-2))',
    '--gradient-hero': 'linear-gradient(135deg, var(--bg), #1a2332)',
    '--gradient-cinematic': 'linear-gradient(135deg, var(--grad-1), var(--grad-2), var(--grad-3))',
  };

  const shadows = {
    '--shadow-soft': '0 4px 20px rgba(0, 0, 0, 0.1)',
    '--shadow-glow': '0 0 40px rgba(47, 123, 255, 0.3)',
  };

  // All Animations from tailwind.config.ts
  const animations = {
    'accordion-down': 'accordion-down 0.2s ease-out',
    'accordion-up': 'accordion-up 0.2s ease-out',
  };

  const keyframes = {
    'accordion-down': {
      from: { height: '0' },
      to: { height: 'var(--radix-accordion-content-height)' }
    },
    'accordion-up': {
      from: { height: 'var(--radix-accordion-content-height)' },
      to: { height: '0' }
    }
  };

  // Typography Scale
  const typography = {
    'text-xs': '0.75rem',
    'text-sm': '0.875rem', 
    'text-base': '1rem',
    'text-lg': '1.125rem',
    'text-xl': '1.25rem',
    'text-2xl': '1.5rem',
    'text-3xl': '1.875rem',
    'text-4xl': '2.25rem',
    'text-5xl': '3rem',
    'text-6xl': '3.75rem',
  };

  // Spacing Scale
  const spacing = {
    '0': '0px',
    '1': '0.25rem',
    '2': '0.5rem', 
    '3': '0.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '8': '2rem',
    '10': '2.5rem',
    '12': '3rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
    '32': '8rem',
  };

  const handleVariableChange = (key: string, value: string) => {
    setCssVariables(prev => ({ ...prev, [key]: value }));
    document.documentElement.style.setProperty(key, value);
  };

  const applyChanges = () => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    toast({
      title: "Changes Applied",
      description: "All style variables updated in real-time",
    });
  };

  const resetToDefaults = () => {
    location.reload();
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to Clipboard",
      description: "Content copied successfully",
    });
  };

  const generateCSS = (variables: Record<string, string>, selector = ':root') => {
    return `${selector} {\n${Object.entries(variables).map(([key, value]) => `  ${key}: ${value};`).join('\n')}\n}`;
  };

  const ColorPreview = ({ variable, value }: { variable: string, value: string }) => {
    const isHSL = !value.startsWith('#');
    const style = isHSL ? { backgroundColor: `hsl(${value})` } : { backgroundColor: value };

    return (
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded border border-border" style={style} />
        <div className="flex-1">
          <Label className="text-sm font-medium">{variable}</Label>
          <Input
            value={value}
            onChange={(e) => handleVariableChange(variable, e.target.value)}
            className="mt-1 text-xs"
            placeholder="Color value"
          />
        </div>
      </div>
    );
  };

  const ComponentShowcase = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="p-4 border rounded-lg bg-card/50">{children}</div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Complete Style System</h1>
        <p className="text-muted-foreground">
          100% comprehensive design system showcasing every class, component, animation, and effect
        </p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <Button onClick={applyChanges} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Apply Changes
        </Button>
        <Button variant="outline" onClick={resetToDefaults}>
          Reset All
        </Button>
        <Button variant="outline" onClick={() => copyToClipboard(generateCSS(cssVariables))}>
          <Copy className="w-4 h-4 mr-2" />
          Copy CSS
        </Button>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 lg:grid-cols-8">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="animations">Animations</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="icons">Icons</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* COLORS TAB */}
        <TabsContent value="colors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Base Colors (HEX)</CardTitle>
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
                <CardTitle>Semantic Colors (HSL)</CardTitle>
              </CardHeader>
              <CardContent>
                <ColorPreview variable="--background" value={cssVariables['--background']} />
                <ColorPreview variable="--foreground" value={cssVariables['--foreground']} />
                <ColorPreview variable="--primary" value={cssVariables['--primary']} />
                <ColorPreview variable="--secondary" value={cssVariables['--secondary']} />
                <ColorPreview variable="--accent" value={cssVariables['--accent']} />
                <ColorPreview variable="--destructive" value={cssVariables['--destructive']} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>UI Elements</CardTitle>
              </CardHeader>
              <CardContent>
                <ColorPreview variable="--border" value={cssVariables['--border']} />
                <ColorPreview variable="--input" value={cssVariables['--input']} />
                <ColorPreview variable="--ring" value={cssVariables['--ring']} />
                <ColorPreview variable="--muted" value={cssVariables['--muted']} />
                <ColorPreview variable="--card" value={cssVariables['--card']} />
                <ColorPreview variable="--popover" value={cssVariables['--popover']} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gradients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(gradients).map(([name, value]) => (
                  <div key={name}>
                    <Label className="text-sm font-medium">{name}</Label>
                    <div className="w-full h-16 rounded border mt-2" style={{ background: value }} />
                    <code className="text-xs text-muted-foreground mt-1 block">{value}</code>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shadows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(shadows).map(([name, value]) => (
                  <div key={name}>
                    <Label className="text-sm font-medium">{name}</Label>
                    <div className="w-full h-16 bg-card rounded mt-2 flex items-center justify-center" style={{ boxShadow: value }}>
                      <span className="text-sm text-muted-foreground">Shadow Preview</span>
                    </div>
                    <code className="text-xs text-muted-foreground mt-1 block">{value}</code>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* COMPONENTS TAB */}
        <TabsContent value="components" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <ComponentShowcase title="Buttons - All Variants">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="primary">Primary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="type_3_blue">Type 3 Blue</Button>
                  <Button variant="type_3_red">Type 3 Red</Button>
                  <Button variant="type_4_red">Type 4 Red</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled>Disabled</Button>
                  <Button functionId="test" showCredits>With Credits</Button>
                </div>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Badges">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Alerts">
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Default Alert</AlertTitle>
                  <AlertDescription>This is a default alert message.</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Alert</AlertTitle>
                  <AlertDescription>This is a destructive alert message.</AlertDescription>
                </Alert>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Cards">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This is the card content area.</p>
                </CardContent>
              </Card>
            </ComponentShowcase>

            <ComponentShowcase title="Progress & Loading">
              <div className="space-y-4">
                <div>
                  <Label>Progress Bar</Label>
                  <Progress value={60} className="mt-2" />
                </div>
                <div>
                  <Label>Loading Spinners</Label>
                  <div className="flex gap-4 items-center mt-2">
                    <LoadingSpinner size="sm" />
                    <LoadingSpinner size="default" />
                    <LoadingSpinner size="lg" />
                  </div>
                </div>
                <div>
                  <Label>Skeleton Loading</Label>
                  <div className="space-y-2 mt-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Accordion">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is it accessible?</AccordionTrigger>
                  <AccordionContent>
                    Yes. It adheres to the WAI-ARIA design pattern.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Is it styled?</AccordionTrigger>
                  <AccordionContent>
                    Yes. It comes with default styles that match the other components.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ComponentShowcase>

          </div>
        </TabsContent>

        {/* TYPOGRAPHY TAB */}
        <TabsContent value="typography" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Text Sizes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(typography).map(([className, size]) => (
                  <div key={className} className="flex items-center justify-between">
                    <span className={className}>Sample Text ({className})</span>
                    <code className="text-xs text-muted-foreground">{size}</code>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Font Weights & Styles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-thin">Thin Font Weight</p>
                <p className="font-light">Light Font Weight</p>
                <p className="font-normal">Normal Font Weight</p>
                <p className="font-medium">Medium Font Weight</p>
                <p className="font-semibold">Semibold Font Weight</p>
                <p className="font-bold">Bold Font Weight</p>
                <p className="font-extrabold">Extrabold Font Weight</p>
                <p className="italic">Italic Text</p>
                <p className="underline">Underlined Text</p>
                <p className="line-through">Strikethrough Text</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Headings & Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h1 className="text-4xl font-bold">Heading 1</h1>
              <h2 className="text-3xl font-semibold">Heading 2</h2>
              <h3 className="text-2xl font-semibold">Heading 3</h3>
              <h4 className="text-xl font-medium">Heading 4</h4>
              <h5 className="text-lg font-medium">Heading 5</h5>
              <h6 className="text-base font-medium">Heading 6</h6>
              <p className="text-base">Regular paragraph text with normal weight and line height.</p>
              <p className="text-sm text-muted-foreground">Small muted text for descriptions and captions.</p>
              <blockquote className="border-l-4 border-primary pl-4 italic">
                "This is a blockquote example with border and italic styling."
              </blockquote>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANIMATIONS TAB */}
        <TabsContent value="animations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Built-in Animations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(animations).map(([name, value]) => (
                  <div key={name} className="p-3 border rounded">
                    <Label className="font-medium">{name}</Label>
                    <code className="block text-xs text-muted-foreground mt-1">{value}</code>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interactive Transitions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hover Effects</Label>
                  <div className="flex gap-2">
                    <Button className="transition-transform hover:scale-105">Scale Hover</Button>
                    <Button className="transition-colors hover:bg-primary/80">Color Transition</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Focus States</Label>
                  <Input placeholder="Focus me to see ring animation" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Animation Keyframes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(keyframes).map(([name, frames]) => (
                  <div key={name} className="p-3 border rounded">
                    <Label className="font-medium">{name}</Label>
                    <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                      {JSON.stringify(frames, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LAYOUT TAB */}
        <TabsContent value="layout" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spacing Scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(spacing).map(([className, size]) => (
                  <div key={className} className="flex items-center gap-4">
                    <div className={`bg-primary h-4 w-${className}`} style={{ width: size }} />
                    <span className="text-sm">w-{className}</span>
                    <code className="text-xs text-muted-foreground">{size}</code>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Layout Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Separator</Label>
                  <Separator className="mt-2" />
                </div>
                <div>
                  <Label>Scroll Area</Label>
                  <ScrollArea className="h-20 w-full border rounded p-2">
                    <div className="space-y-1">
                      <p>Scrollable content line 1</p>
                      <p>Scrollable content line 2</p>
                      <p>Scrollable content line 3</p>
                      <p>Scrollable content line 4</p>
                      <p>Scrollable content line 5</p>
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grid & Flex Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Grid Layout</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="bg-primary/20 p-4 rounded text-center">Grid 1</div>
                  <div className="bg-primary/20 p-4 rounded text-center">Grid 2</div>
                  <div className="bg-primary/20 p-4 rounded text-center">Grid 3</div>
                </div>
              </div>
              <div>
                <Label>Flex Layout</Label>
                <div className="flex gap-4 mt-2">
                  <div className="bg-secondary/50 p-4 rounded flex-1 text-center">Flex 1</div>
                  <div className="bg-secondary/50 p-4 rounded flex-1 text-center">Flex 2</div>
                  <div className="bg-secondary/50 p-4 rounded flex-1 text-center">Flex 3</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORMS TAB */}
        <TabsContent value="forms" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Text Input</Label>
                  <Input placeholder="Enter text..." className="mt-1" />
                </div>
                <div>
                  <Label>Textarea</Label>
                  <Textarea placeholder="Enter multiline text..." className="mt-1" />
                </div>
                <div>
                  <Label>Select</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="checkbox" />
                  <Label htmlFor="checkbox">Checkbox</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="switch" />
                  <Label htmlFor="switch">Switch</Label>
                </div>
                <div>
                  <Label>Slider</Label>
                  <Slider defaultValue={[50]} max={100} step={1} className="mt-2" />
                </div>
                <div>
                  <Label>Radio Group</Label>
                  <RadioGroup defaultValue="option1" className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option1" id="r1" />
                      <Label htmlFor="r1">Option 1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option2" id="r2" />
                      <Label htmlFor="r2">Option 2</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ICONS TAB */}
        <TabsContent value="icons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lucide React Icons</CardTitle>
              <CardDescription>All icons available from the lucide-react library</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
                {[
                  { Icon: Home, name: 'Home' },
                  { Icon: User, name: 'User' }, 
                  { Icon: Settings, name: 'Settings' },
                  { Icon: BarChart3, name: 'BarChart3' },
                  { Icon: Mail, name: 'Mail' },
                  { Icon: Lock, name: 'Lock' },
                  { Icon: Eye, name: 'Eye' },
                  { Icon: EyeOff, name: 'EyeOff' },
                  { Icon: Search, name: 'Search' },
                  { Icon: Plus, name: 'Plus' },
                  { Icon: Trash2, name: 'Trash2' },
                  { Icon: Edit, name: 'Edit' },
                  { Icon: Save, name: 'Save' },
                  { Icon: X, name: 'X' },
                  { Icon: Check, name: 'Check' },
                  { Icon: Star, name: 'Star' },
                  { Icon: Heart, name: 'Heart' },
                  { Icon: Share, name: 'Share' },
                  { Icon: Bell, name: 'Bell' },
                  { Icon: Calendar, name: 'Calendar' },
                  { Icon: Camera, name: 'Camera' },
                  { Icon: Zap, name: 'Zap' },
                  { Icon: AlertCircle, name: 'AlertCircle' },
                  { Icon: CheckCircle, name: 'CheckCircle' },
                  { Icon: Info, name: 'Info' },
                  { Icon: Copy, name: 'Copy' },
                  { Icon: Download, name: 'Download' },
                  { Icon: RefreshCw, name: 'RefreshCw' },
                ].map(({ Icon, name }) => (
                  <div key={name} className="flex flex-col items-center p-2 hover:bg-muted rounded transition-colors">
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-xs text-center">{name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXPORT TAB */}
        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Complete CSS</CardTitle>
                <CardDescription>Copy all CSS variables and styles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => copyToClipboard(generateCSS(cssVariables))}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy CSS Variables
                  </Button>
                  <Button onClick={() => copyToClipboard(JSON.stringify({ cssVariables, gradients, shadows, animations, keyframes }, null, 2))}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON Config
                  </Button>
                </div>
                <div>
                  <Label>CSS Variables Output</Label>
                  <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto mt-2 max-h-96">
                    {generateCSS(cssVariables)}
                  </pre>
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