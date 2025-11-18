import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export async function generateSampleData() {
  const { toast } = useToast();
  
  try {
    // Sample AI Systems
    const systems = [
      {
        name: "Customer Support Chatbot",
        description: "AI-powered customer service assistant",
        risk_level: "medium",
        deployment_environment: "production",
        model_type: "Large Language Model",
        data_type: "Customer conversations",
        geography: "EU",
        business_unit: "Customer Service",
        owner: "John Smith",
      },
      {
        name: "Fraud Detection System",
        description: "ML system for detecting fraudulent transactions",
        risk_level: "high",
        deployment_environment: "production",
        model_type: "Classification",
        data_type: "Transaction data",
        geography: "Global",
        business_unit: "Security",
        owner: "Sarah Johnson",
      },
      {
        name: "Recommendation Engine",
        description: "Product recommendation system",
        risk_level: "low",
        deployment_environment: "production",
        model_type: "Collaborative Filtering",
        data_type: "User behavior data",
        geography: "US",
        business_unit: "Marketing",
        owner: "Mike Davis",
      },
    ];

    const { data: insertedSystems, error: systemsError } = await supabase
      .from("ai_systems")
      .insert(systems)
      .select();

    if (systemsError) throw systemsError;
    if (!insertedSystems || insertedSystems.length === 0) {
      throw new Error("No systems were inserted");
    }

    // Sample Assessments
    const assessments = [
      {
        ai_system_id: insertedSystems[0].id,
        template: "eu_ai_act" as const,
        risk_level: "medium",
        nist_score: 75,
        iso_readiness_score: 68,
        assessment_data: { score: 75 },
      },
      {
        ai_system_id: insertedSystems[1].id,
        template: "nist_ai_rmf" as const,
        risk_level: "high",
        nist_score: 82,
        iso_readiness_score: 71,
        assessment_data: { score: 82 },
      },
      {
        ai_system_id: insertedSystems[2].id,
        template: "iso_42001" as const,
        risk_level: "low",
        nist_score: 65,
        iso_readiness_score: 78,
        assessment_data: { score: 78 },
      },
    ];

    const { data: insertedAssessments, error: assessmentsError } = await supabase
      .from("assessments")
      .insert(assessments)
      .select();

    if (assessmentsError) throw assessmentsError;

    // Sample Tasks
    const tasks = [
      {
        title: "Complete data privacy impact assessment",
        description: "Conduct DPIA for customer chatbot",
        ai_system_id: insertedSystems[0].id,
        status: "in_progress",
        priority: "high",
        owner: "John Smith",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: "Review model bias testing results",
        description: "Analyze bias metrics from recent evaluation",
        ai_system_id: insertedSystems[1].id,
        status: "open",
        priority: "critical",
        owner: "Sarah Johnson",
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: "Update acceptable use policy",
        description: "Revise policy based on new regulations",
        ai_system_id: insertedSystems[0].id,
        status: "completed",
        priority: "medium",
        owner: "Legal Team",
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: "Implement model monitoring dashboard",
        description: "Set up real-time monitoring for fraud detection",
        ai_system_id: insertedSystems[1].id,
        status: "open",
        priority: "high",
        owner: "Mike Davis",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ];

    const { error: tasksError } = await supabase
      .from("tasks")
      .insert(tasks);

    if (tasksError) throw tasksError;

    // Sample Documents
    const documents = [
      {
        title: "Customer Chatbot - Acceptable Use Policy",
        type: "acceptable_use_policy",
        content: "This policy defines acceptable use guidelines for the AI chatbot system...",
        ai_system_id: insertedSystems[0].id,
        assessment_id: insertedAssessments?.[0]?.id,
      },
      {
        title: "Fraud Detection - System Card",
        type: "system_card",
        content: "System card documenting the fraud detection AI system capabilities and limitations...",
        ai_system_id: insertedSystems[1].id,
        assessment_id: insertedAssessments?.[1]?.id,
      },
      {
        title: "Recommendation Engine - Risk Summary",
        type: "risk_summary",
        content: "Risk assessment summary for the product recommendation engine...",
        ai_system_id: insertedSystems[2].id,
        assessment_id: insertedAssessments?.[2]?.id,
      },
    ];

    const { error: documentsError } = await supabase
      .from("documents")
      .insert(documents);

    if (documentsError) throw documentsError;

    return {
      success: true,
      message: "Sample data generated successfully",
      data: {
        systems: insertedSystems.length,
        assessments: insertedAssessments?.length || 0,
        tasks: tasks.length,
        documents: documents.length,
      },
    };
  } catch (error) {
    console.error("Error generating sample data:", error);
    throw error;
  }
}
