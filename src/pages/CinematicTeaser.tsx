import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload } from "lucide-react";

const CinematicTeaser = () => {
  return (
    <div className="bg-gradient-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Cinematic Teaser
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your photos and transform them into stunning cinematic moments with our AI-powered editing tools.
          </p>

          <div className="max-w-md mx-auto">
            <Card className="p-8">
              <div className="border-2 border-dashed border-border rounded-[var(--radius)] p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Drag and drop your photos here, or click to browse
                </p>
                <Button variant="primary" size="lg">
                  Choose Photos
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinematicTeaser;