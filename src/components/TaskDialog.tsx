import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional().or(z.literal("")),
  owner: z.string().trim().max(100, "Owner name must be less than 100 characters").optional().or(z.literal("")),
  status: z.enum(["open", "in_progress", "completed", "blocked"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  due_date: z.string().optional().or(z.literal("")),
});

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
  systemId?: string;
  assessmentId?: string;
  onComplete: () => void;
}

export function TaskDialog({ open, onOpenChange, task, systemId, assessmentId, onComplete }: TaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setOwner(task.owner || "");
      setStatus(task.status || "open");
      setPriority(task.priority || "medium");
      setDueDate(task.due_date || "");
    } else {
      resetForm();
    }
  }, [task, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOwner("");
    setStatus("open");
    setPriority("medium");
    setDueDate("");
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate form data
      const validatedData = taskSchema.parse({
        title,
        description,
        owner,
        status,
        priority,
        due_date: dueDate,
      });

      const taskData = {
        title: validatedData.title,
        description: validatedData.description || null,
        owner: validatedData.owner || null,
        status: validatedData.status,
        priority: validatedData.priority,
        due_date: validatedData.due_date || null,
        ai_system_id: systemId || task?.ai_system_id || null,
        assessment_id: assessmentId || task?.assessment_id || null,
      };

      if (task) {
        // Update existing task
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", task.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        // Create new task
        const { error } = await supabase
          .from("tasks")
          .insert([taskData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Task created successfully",
        });
      }

      onComplete();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save task. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update task details" : "Create a new compliance task"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Enter owner name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                task ? "Update Task" : "Create Task"
              )}
            </Button>
            {task && (
              <Button onClick={handleDelete} disabled={loading} variant="destructive">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
