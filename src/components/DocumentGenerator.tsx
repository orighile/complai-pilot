import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface DocumentGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemId: string;
  assessments: any[];
  onComplete: () => void;
}

export function DocumentGenerator({ open, onOpenChange, systemId, assessments, onComplete }: DocumentGeneratorProps) {
  const [documentType, setDocumentType] = useState<string>("");
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateDocument = async () => {
    if (!documentType) {
      toast({
        title: "Error",
        description: "Please select a document type",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            systemId,
            assessmentId: assessmentId || undefined,
            type: documentType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Document generation failed");
      }

      const result = await response.json();

      toast({
        title: "Document Generated",
        description: "Your document has been created successfully",
      });

      onComplete();
      onOpenChange(false);
      setDocumentType("");
      setAssessmentId("");
    } catch (error) {
      console.error("Error generating document:", error);
      toast({
        title: "Error",
        description: "Failed to generate document",
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
          <DialogTitle>Generate Document</DialogTitle>
          <DialogDescription>
            Create compliance documentation for your AI system
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acceptable_use_policy">Acceptable Use Policy</SelectItem>
                <SelectItem value="system_card">System Card</SelectItem>
                <SelectItem value="risk_summary">Risk Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessment">Assessment (Optional)</Label>
            <Select value={assessmentId} onValueChange={setAssessmentId}>
              <SelectTrigger id="assessment">
                <SelectValue placeholder="Select an assessment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    {assessment.template.replace(/_/g, ' ')} - {new Date(assessment.created_at).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateDocument} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Document...
              </>
            ) : (
              "Generate Document"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
