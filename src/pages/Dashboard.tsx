import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Shield, CheckCircle, AlertCircle, FileText, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { generateSampleData } from "@/lib/sampleData";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalSystems: 0,
    highRiskSystems: 0,
    assessmentsCompleted: 0,
    openTasks: 0,
  });
  const [riskDistribution, setRiskDistribution] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch AI systems
    const { data: systems } = await supabase
      .from("ai_systems")
      .select("*");

    // Fetch assessments
    const { data: assessments } = await supabase
      .from("assessments")
      .select("*");

    // Fetch tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "open");

    const totalSystems = systems?.length || 0;
    const highRiskSystems = systems?.filter(s => s.risk_level === "high" || s.risk_level === "critical").length || 0;

    setStats({
      totalSystems,
      highRiskSystems,
      assessmentsCompleted: assessments?.length || 0,
      openTasks: tasks?.length || 0,
    });

    // Risk distribution
    const riskCounts = {
      critical: systems?.filter(s => s.risk_level === "critical").length || 0,
      high: systems?.filter(s => s.risk_level === "high").length || 0,
      medium: systems?.filter(s => s.risk_level === "medium").length || 0,
      low: systems?.filter(s => s.risk_level === "low").length || 0,
      minimal: systems?.filter(s => s.risk_level === "minimal").length || 0,
    };

    setRiskDistribution([
      { name: "Critical", value: riskCounts.critical, color: "hsl(var(--risk-critical))" },
      { name: "High", value: riskCounts.high, color: "hsl(var(--risk-high))" },
      { name: "Medium", value: riskCounts.medium, color: "hsl(var(--risk-medium))" },
      { name: "Low", value: riskCounts.low, color: "hsl(var(--risk-low))" },
      { name: "Minimal", value: riskCounts.minimal, color: "hsl(var(--risk-minimal))" },
    ].filter(item => item.value > 0));

    // Recent activity
    const recentSystems = systems?.slice(-3).reverse() || [];
    const recentAssessments = assessments?.slice(-3).reverse() || [];
    
    const activity = [
      ...recentSystems.map(s => ({
        type: "AI System Created",
        name: s.name,
        time: new Date(s.created_at).toLocaleDateString(),
      })),
      ...recentAssessments.map(a => ({
        type: "Assessment Completed",
        name: a.template,
        time: new Date(a.created_at).toLocaleDateString(),
      })),
    ].slice(0, 5);

    setRecentActivity(activity);
  };

  const handleGenerateSampleData = async () => {
    try {
      setLoading(true);
      const result = await generateSampleData();
      
      toast({
        title: "Success",
        description: `Generated ${result.data.systems} systems, ${result.data.assessments} assessments, ${result.data.tasks} tasks, and ${result.data.documents} documents`,
      });
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate sample data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your AI compliance posture</p>
        </div>
        <Button onClick={handleGenerateSampleData} disabled={loading} variant="outline">
          <Database className="h-4 w-4 mr-2" />
          {loading ? "Generating..." : "Generate Sample Data"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total AI Systems</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSystems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High-Risk Systems</CardTitle>
            <AlertCircle className="h-4 w-4 text-risk-high" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highRiskSystems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assessments Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assessmentsCompleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTasks}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {riskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <TrendingUp className="h-4 w-4 mt-1 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">{activity.name}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}