import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TaskDialog } from "@/components/TaskDialog";

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowDialog(true);
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setShowDialog(true);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: "bg-risk-critical text-white",
      high: "bg-risk-high text-white",
      medium: "bg-risk-medium text-white",
      low: "bg-risk-low text-white",
    };
    return colors[priority] || "bg-muted";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-status-pending text-white",
      in_progress: "bg-blue-500 text-white",
      completed: "bg-green-500 text-white",
      blocked: "bg-red-500 text-white",
    };
    return colors[status] || "bg-muted";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage compliance tasks and action items</p>
        </div>
        <Button onClick={handleCreateTask}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
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
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEditTask(task)}
                  >
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.owner || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No tasks yet. Create your first task to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TaskDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        task={selectedTask}
        onComplete={fetchTasks}
      />
    </div>
  );
}