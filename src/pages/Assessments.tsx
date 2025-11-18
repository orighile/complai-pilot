import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function Assessments() {
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => {
    const fetchAssessments = async () => {
      const { data } = await supabase
        .from("assessments")
        .select("*, ai_systems(name)")
        .order("created_at", { ascending: false });
      setAssessments(data || []);
    };
    fetchAssessments();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Assessments</h1>
      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AI System</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell>{assessment.ai_systems?.name}</TableCell>
                  <TableCell className="capitalize">{assessment.template.replace(/_/g, ' ')}</TableCell>
                  <TableCell><Badge>{assessment.risk_level}</Badge></TableCell>
                  <TableCell>{new Date(assessment.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}