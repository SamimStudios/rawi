import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, TestTube, Database, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHybridValue, useAddressValidation, useAddressExists } from '@/lib/ltree/hooks';
import { HybridAddrService } from '@/lib/ltree/service';

export default function LtreeTesterPage() {
  // Pre-fill with real job ID from your database
  const [jobId, setJobId] = useState('7d6e3fe9-5ed8-4e27-9a9c-eb3f80d9d0ce');
  const [address, setAddress] = useState('');
  const [jsonValue, setJsonValue] = useState('{\n  "example": "Test Value"\n}');
  const [mode, setMode] = useState<'read' | 'write'>('read');
  const { toast } = useToast();

  // Hooks for real-time validation and data
  const addressValidation = useAddressValidation(address || null);
  const addressExists = useAddressExists(jobId || null, address || null);
  const hybridValue = useHybridValue(
    jobId && mode === 'read' ? jobId : null, 
    address && mode === 'read' ? address : null
  );

  const handleWrite = async () => {
    if (!jobId || !address) {
      toast({
        title: "Missing Fields",
        description: "Job ID and Address are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsedValue = JSON.parse(jsonValue);
      await HybridAddrService.setItemAt({
        jobId,
        address,
        value: parsedValue
      });
      
      toast({
        title: "Success",
        description: "Value written successfully",
      });
    } catch (error) {
      toast({
        title: "Write Error",
        description: error instanceof Error ? error.message : "Failed to write value",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const exampleAddresses = [
    {
      label: "User Input - Size Field",
      address: "user_input#size.value",
      description: "Access the size field value using path-based addressing"
    },
    {
      label: "User Input - Lead Character Name",
      address: "user_input#characters.lead.character_name.value",
      description: "Access lead character name using path-based addressing"
    },
    {
      label: "User Input - Supporting Character Gender", 
      address: "user_input#characters.supporting.character_gender.value",
      description: "Access supporting character gender using path-based addressing"
    },
    {
      label: "User Input - Language Field",
      address: "user_input#language.value",
      description: "Access the language field value"
    },
    {
      label: "User Input Node (Full Content)", 
      address: "user_input",
      description: "Get entire user_input node content"
    },
    {
      label: "User Input - Characters Section",
      address: "user_input#characters",
      description: "Get the characters section content"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <TestTube className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Hybrid Address System Tester</h1>
          <p className="text-muted-foreground">
            Test ltree#json.path addressing for job node data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Input Configuration
            </CardTitle>
            <CardDescription>
              Configure your test parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobId">Job ID</Label>
              <Input
                id="jobId"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter job UUID"
                className="font-mono"
              />
            </div>

            <div>
              <Label htmlFor="address">Hybrid Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., root.user_input#preferences.size"
                className="font-mono"
              />
              {address && (
                <div className="flex items-center gap-2 mt-2">
                  {addressValidation.isValid ? (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid Format
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" />
                      Invalid Format
                    </Badge>
                  )}
                  
                  {jobId && address && addressValidation.isValid && (
                    <Badge variant={addressExists.exists ? "default" : "secondary"}>
                      <Database className="h-3 w-3 mr-1" />
                      {addressExists.loading ? "Checking..." : 
                       addressExists.exists ? "Exists" : "Not Found"}
                    </Badge>
                  )}
                </div>
              )}
              {addressValidation.error && (
                <Alert className="mt-2">
                  <AlertDescription className="text-sm">
                    {addressValidation.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'read' | 'write')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="read">Read Mode</TabsTrigger>
                <TabsTrigger value="write">Write Mode</TabsTrigger>
              </TabsList>
              
              <TabsContent value="write" className="space-y-4">
                <div>
                  <Label htmlFor="jsonValue">JSON Value</Label>
                  <Textarea
                    id="jsonValue"
                    value={jsonValue}
                    onChange={(e) => setJsonValue(e.target.value)}
                    placeholder="Enter JSON value to write"
                    className="font-mono min-h-[120px]"
                  />
                </div>
                <Button 
                  onClick={handleWrite}
                  disabled={!jobId || !address || !addressValidation.isValid}
                  className="w-full"
                >
                  Write Value
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {mode === 'read' ? 'Current Value' : 'Write Status'}
            </CardTitle>
            <CardDescription>
              {mode === 'read' ? 'Live data from the address' : 'Result of write operation'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'read' ? (
              <div className="space-y-4">
                {hybridValue.loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                  </div>
                )}
                
                {hybridValue.error && (
                  <Alert>
                    <AlertDescription>
                      {hybridValue.error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {!hybridValue.loading && !hybridValue.error && hybridValue.value !== null && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Retrieved Value</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(hybridValue.value, null, 2))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-96">
                      {JSON.stringify(hybridValue.value, null, 2)}
                    </pre>
                  </div>
                )}
                
                {!hybridValue.loading && !hybridValue.error && hybridValue.value === null && jobId && address && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No value found at this address</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Configure your write operation and click "Write Value"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Example Addresses */}
      <Card>
        <CardHeader>
          <CardTitle>Example Addresses</CardTitle>
          <CardDescription>
            Click on any example to load it into the tester
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {exampleAddresses.map((example, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setAddress(example.address)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{example.label}</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                    {example.address}
                  </code>
                </div>
                <p className="text-sm text-muted-foreground">
                  {example.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Address Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Hybrid Address Syntax</h4>
              <code className="bg-muted p-2 rounded block">
                ltree.path#json.dot.path
              </code>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Ltree Path (left of #)</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Hierarchical node path</li>
                  <li>• Segments separated by dots</li>
                  <li>• Example: <code>root.user_input</code></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">JSON Path (right of #)</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Dot notation for nested fields</li>
                  <li>• Optional (omit # for full content)</li>
                  <li>• Example: <code>preferences.size</code></li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}