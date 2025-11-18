import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export default function Documents() {
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      const { data } = await supabase.from("documents").select("*, ai_systems(name)").order("created_at", { ascending: false });
      setDocuments(data || []);
    };
    fetchDocuments();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Documents</h1>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>AI System</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.title}</TableCell>
                  <TableCell className="capitalize">{doc.type.replace(/_/g, ' ')}</TableCell>
                  <TableCell>{doc.ai_systems?.name}</TableCell>
                  <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}