import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EvidenceUpload } from "@/components/EvidenceUpload";
import { useToast } from "@/hooks/use-toast";

export default function Evidence() {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    const { data } = await supabase.from("evidence").select("*, ai_systems(name)").order("created_at", { ascending: false });
    setEvidence(data || []);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('evidence')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evidence</h1>
          <p className="text-muted-foreground">Manage compliance evidence files</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Evidence
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Evidence Files</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>AI System</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evidence.length > 0 ? (
                evidence.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.file_name}</TableCell>
                    <TableCell>{item.ai_systems?.name || "-"}</TableCell>
                    <TableCell>{(item.file_size / 1024).toFixed(2)} KB</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(item.file_path, item.file_name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No evidence files yet. Upload your first evidence file to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EvidenceUpload
        open={showUpload}
        onOpenChange={setShowUpload}
        onComplete={fetchEvidence}
      />
    </div>
  );
}
