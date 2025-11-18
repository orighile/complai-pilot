import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AssessmentRunner } from "@/components/AssessmentRunner";
import { DocumentGenerator } from "@/components/DocumentGenerator";
import { useToast } from "@/hooks/use-toast";

export default function SystemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [system, setSystem] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssessmentRunner, setShowAssessmentRunner] = useState(false);
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSystemData();
    }
  }, [id]);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      // Fetch system details
      const { data: systemData, error: systemError } = await supabase
        .from("ai_systems")
        .select("*")
        .eq("id", id)
        .single();

      if (systemError) throw systemError;
      setSystem(systemData);

      // Fetch related assessments
      const { data: assessmentsData } = await supabase
        .from("assessments")
        .select("*")
        .eq("ai_system_id", id)
        .order("created_at", { ascending: false });
      setAssessments(assessmentsData || []);

      // Fetch related documents
      const { data: documentsData } = await supabase
        .from("documents")
        .select("*")
        .eq("ai_system_id", id)
        .order("created_at", { ascending: false });
      setDocuments(documentsData || []);

      // Fetch related tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("ai_system_id", id)
        .order("created_at", { ascending: false });
      setTasks(tasksData || []);

    } catch (error) {
      console.error("Error fetching system data:", error);
      toast({
        title: "Error",
        description: "Failed to load system details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    const colors: Record<string, string> = {
      critical: "bg-risk-critical text-white",
      high: "bg-risk-high text-white",
      medium: "bg-risk-medium text-white",
      low: "bg-risk-low text-white",
      minimal: "bg-risk-minimal text-white",
      pending: "bg-status-pending text-white",
    };
    return colors[risk] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!system) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">System not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/systems")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{system.name}</h1>
            <p className="text-muted-foreground">{system.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAssessmentRunner(true)}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Run Assessment
          </Button>
          <Button variant="outline" onClick={() => setShowDocumentGenerator(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Document
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Risk Level</p>
              <Badge className={getRiskBadgeColor(system.risk_level)}>
                {system.risk_level || "Pending"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="font-medium">{system.owner || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Business Unit</p>
              <p className="font-medium">{system.business_unit || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Model Type</p>
              <p className="font-medium">{system.model_type || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deployment Environment</p>
              <p className="font-medium">{system.deployment_environment || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Geography</p>
              <p className="font-medium">{system.geography || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="assessments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
              <CardDescription>View all assessments for this AI system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>NIST Score</TableHead>
                    <TableHead>ISO Score</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.length > 0 ? (
                    assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="capitalize">{assessment.template.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <Badge>{assessment.risk_level || "-"}</Badge>
                        </TableCell>
                        <TableCell>{assessment.nist_score || "-"}</TableCell>
                        <TableCell>{assessment.iso_readiness_score || "-"}</TableCell>
                        <TableCell>{new Date(assessment.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No assessments yet. Run your first assessment to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Generated Documents</CardTitle>
              <CardDescription>Documents generated for this AI system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.title}</TableCell>
                        <TableCell className="capitalize">{doc.type.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No documents yet. Generate your first document to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Related Tasks</CardTitle>
              <CardDescription>Tasks associated with this AI system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>{task.owner || "-"}</TableCell>
                        <TableCell><Badge>{task.status}</Badge></TableCell>
                        <TableCell><Badge>{task.priority}</Badge></TableCell>
                        <TableCell>{task.due_date || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No tasks yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AssessmentRunner
        open={showAssessmentRunner}
        onOpenChange={setShowAssessmentRunner}
        systemId={system.id}
        onComplete={fetchSystemData}
      />

      <DocumentGenerator
        open={showDocumentGenerator}
        onOpenChange={setShowDocumentGenerator}
        systemId={system.id}
        assessments={assessments}
        onComplete={fetchSystemData}
      />
    </div>
  );
}
