import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

const systemSchema = z.object({
  name: z.string().trim().min(1, "System name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional().or(z.literal("")),
  owner: z.string().trim().max(100, "Owner name must be less than 100 characters").optional().or(z.literal("")),
  business_unit: z.string().trim().max(100, "Business unit must be less than 100 characters").optional().or(z.literal("")),
  geography: z.string().trim().max(100, "Geography must be less than 100 characters").optional().or(z.literal("")),
  data_type: z.string().trim().max(100, "Data type must be less than 100 characters").optional().or(z.literal("")),
  model_type: z.string().trim().max(100, "Model type must be less than 100 characters").optional().or(z.literal("")),
  training_source: z.string().trim().max(200, "Training source must be less than 200 characters").optional().or(z.literal("")),
  deployment_environment: z.string().trim().max(100, "Deployment environment must be less than 100 characters").optional().or(z.literal("")),
});

export default function NewSystem() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    owner: "",
    business_unit: "",
    geography: "",
    data_type: "",
    model_type: "",
    training_source: "",
    deployment_environment: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      const validatedData = systemSchema.parse(formData);

      // Convert empty strings to null for optional fields
      const insertData = {
        name: validatedData.name,
        description: validatedData.description || null,
        owner: validatedData.owner || null,
        business_unit: validatedData.business_unit || null,
        geography: validatedData.geography || null,
        data_type: validatedData.data_type || null,
        model_type: validatedData.model_type || null,
        training_source: validatedData.training_source || null,
        deployment_environment: validatedData.deployment_environment || null,
      };

      const { error } = await supabase
        .from("ai_systems")
        .insert([insertData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI system created successfully",
      });
      navigate("/systems");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create AI system. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate("/systems")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Systems
        </Button>
        <h1 className="text-3xl font-bold">New AI System</h1>
        <p className="text-muted-foreground">Add a new AI system to your inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Enter the details of your AI system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">System Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => updateFormData("owner", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_unit">Business Unit</Label>
                <Input
                  id="business_unit"
                  value={formData.business_unit}
                  onChange={(e) => updateFormData("business_unit", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="geography">Geography</Label>
                <Input
                  id="geography"
                  value={formData.geography}
                  onChange={(e) => updateFormData("geography", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_type">Data Type</Label>
                <Select value={formData.data_type} onValueChange={(value) => updateFormData("data_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal Data</SelectItem>
                    <SelectItem value="sensitive">Sensitive Data</SelectItem>
                    <SelectItem value="public">Public Data</SelectItem>
                    <SelectItem value="proprietary">Proprietary Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model_type">Model Type</Label>
                <Select value={formData.model_type} onValueChange={(value) => updateFormData("model_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llm">Large Language Model</SelectItem>
                    <SelectItem value="computer_vision">Computer Vision</SelectItem>
                    <SelectItem value="predictive">Predictive Analytics</SelectItem>
                    <SelectItem value="recommendation">Recommendation System</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="training_source">Training Source</Label>
                <Input
                  id="training_source"
                  value={formData.training_source}
                  onChange={(e) => updateFormData("training_source", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deployment_environment">Deployment Environment</Label>
                <Select value={formData.deployment_environment} onValueChange={(value) => updateFormData("deployment_environment", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create System"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/systems")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}