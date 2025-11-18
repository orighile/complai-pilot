import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AssessmentRunnerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemId: string;
  onComplete: () => void;
}

export function AssessmentRunner({ open, onOpenChange, systemId, onComplete }: AssessmentRunnerProps) {
  const [template, setTemplate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRunAssessment = async () => {
    if (!template) {
      toast({
        title: "Error",
        description: "Please select an assessment template",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-assessment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            systemId,
            template,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Assessment failed");
      }

      const result = await response.json();

      toast({
        title: "Assessment Complete",
        description: `Risk Level: ${result.risk_level || "Unknown"}`,
      });

      onComplete();
      onOpenChange(false);
      setTemplate("");
    } catch (error) {
      console.error("Error running assessment:", error);
      toast({
        title: "Error",
        description: "Failed to run assessment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run Assessment</DialogTitle>
          <DialogDescription>
            Select an assessment template to evaluate your AI system
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Assessment Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eu_ai_act">EU AI Act</SelectItem>
                <SelectItem value="nist_ai_rmf">NIST AI RMF</SelectItem>
                <SelectItem value="iso_42001">ISO 42001</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleRunAssessment} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Assessment...
              </>
            ) : (
              "Run Assessment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
