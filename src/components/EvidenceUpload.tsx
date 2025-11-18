import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import { z } from "zod";

interface EvidenceUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemId?: string;
  assessmentId?: string;
  onComplete: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const fileSchema = z.object({
  name: z.string().max(255),
  size: z.number().max(MAX_FILE_SIZE, "File size must be less than 10MB"),
  type: z.string().refine((type) => ALLOWED_FILE_TYPES.includes(type), {
    message: "Invalid file type. Allowed: PDF, Images, Word, Excel, Text, CSV",
  }),
});

export function EvidenceUpload({ open, onOpenChange, systemId, assessmentId, onComplete }: EvidenceUploadProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState(systemId || "");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(assessmentId || "");
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    try {
      fileSchema.parse({
        name: file.name,
        size: file.size,
        type: file.type,
      });
      setSelectedFile(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid File",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create a unique file path with user folder
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(fileName);

      // Create evidence record in database
      const { error: dbError } = await supabase
        .from('evidence')
        .insert([{
          file_name: selectedFile.name,
          file_path: fileName,
          file_size: selectedFile.size,
          ai_system_id: selectedSystemId || null,
          assessment_id: selectedAssessmentId || null,
        }]);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Evidence file uploaded successfully",
      });

      onComplete();
      onOpenChange(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading evidence:", error);
      toast({
        title: "Error",
        description: "Failed to upload evidence file",
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
          <DialogTitle>Upload Evidence</DialogTitle>
          <DialogDescription>
            Upload compliance evidence files (Max 10MB)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/10' : 'border-border'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <p className="font-medium">{selectedFile.name}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop a file here, or click to select
                </p>
                <input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Select File
                </Button>
              </div>
            )}
          </div>

          {!systemId && (
            <div className="space-y-2">
              <Label>Link to AI System (Optional)</Label>
              <Select value={selectedSystemId} onValueChange={setSelectedSystemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {/* Systems will be loaded dynamically */}
                </SelectContent>
              </Select>
            </div>
          )}

          {!assessmentId && (
            <div className="space-y-2">
              <Label>Link to Assessment (Optional)</Label>
              <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {/* Assessments will be loaded dynamically */}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleUpload} disabled={loading || !selectedFile} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Evidence
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
