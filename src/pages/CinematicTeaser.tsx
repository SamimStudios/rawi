import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";

const CinematicTeaser = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Cinematic Teaser
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your photos and transform them into stunning cinematic moments with our AI-powered editing tools.
          </p>

          <div className="bg-card rounded-lg p-8 max-w-md mx-auto shadow-cinematic border border-border">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Drag and drop your photos here, or click to browse
              </p>
              <Button variant="hero" size="lg">
                Choose Photos
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinematicTeaser;