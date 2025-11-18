import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AISystems() {
  const [systems, setSystems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchSystems();
  }, []);

  const fetchSystems = async () => {
    const { data } = await supabase
      .from("ai_systems")
      .select("*")
      .order("created_at", { ascending: false });
    
    setSystems(data || []);
  };

  const filteredSystems = systems.filter(system =>
    system.name.toLowerCase().includes(search.toLowerCase()) ||
    system.description?.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Systems</h1>
          <p className="text-muted-foreground">Manage your AI system inventory</p>
        </div>
        <Button onClick={() => navigate("/systems/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add System
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search systems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Business Unit</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Model Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSystems.length > 0 ? (
                filteredSystems.map((system) => (
                  <TableRow
                    key={system.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/systems/${system.id}`)}
                  >
                    <TableCell className="font-medium">{system.name}</TableCell>
                    <TableCell>{system.owner || "-"}</TableCell>
                    <TableCell>{system.business_unit || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getRiskBadgeColor(system.risk_level)}>
                        {system.risk_level || "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>{system.model_type || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No systems found. Add your first AI system to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}