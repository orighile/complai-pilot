import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { systemId, template } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Fetch AI system data
    const { data: system } = await supabaseClient
      .from('ai_systems')
      .select('*')
      .eq('id', systemId)
      .single();

    if (!system) {
      throw new Error('System not found');
    }

    // Prepare assessment prompts based on template
    let systemPrompt = "";
    let userPrompt = "";

    if (template === "eu_ai_act") {
      systemPrompt = "You are an EU AI Act compliance expert. Analyze AI systems and classify them according to the EU AI Act risk categories.";
      userPrompt = `Analyze this AI system for EU AI Act compliance:

System: ${system.name}
Description: ${system.description}
Data Type: ${system.data_type}
Model Type: ${system.model_type}
Use Case: ${system.description}

Provide:
1. Risk classification (unacceptable, high, limited, minimal)
2. EU AI Act category
3. Recommended next actions (list 3-5 specific actions)

Respond in JSON format with: risk_level, eu_ai_act_category, recommended_actions (array)`;
    } else if (template === "nist_ai_rmf") {
      systemPrompt = "You are a NIST AI Risk Management Framework expert. Assess AI systems using NIST AI RMF principles.";
      userPrompt = `Assess this AI system using NIST AI RMF:

System: ${system.name}
Description: ${system.description}
Model Type: ${system.model_type}

Evaluate based on:
- Governance
- Mapping
- Measurement
- Management

Provide:
1. NIST score (0-100)
2. Risk level (minimal, low, medium, high, critical)
3. Recommended actions (3-5 specific improvements)

Respond in JSON format with: nist_score, risk_level, recommended_actions (array)`;
    } else if (template === "iso_42001") {
      systemPrompt = "You are an ISO 42001 AI Management System expert. Assess AI systems for ISO 42001 readiness.";
      userPrompt = `Assess ISO 42001 readiness for:

System: ${system.name}
Description: ${system.description}
Deployment: ${system.deployment_environment}

Evaluate:
- AI system documentation
- Risk management
- Data governance
- Continuous monitoring

Provide:
1. ISO readiness score (0-100)
2. Risk level
3. Recommended actions for ISO compliance

Respond in JSON format with: iso_readiness_score, risk_level, recommended_actions (array)`;
    }

    // Call Lovable AI with structured output
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Failed to run assessment');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    let assessmentData;
    try {
      assessmentData = JSON.parse(content);
    } catch (e) {
      // If not valid JSON, try to extract from markdown code block
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        assessmentData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse assessment response');
      }
    }

    // Save assessment to database
    const { data: savedAssessment, error } = await supabaseClient
      .from('assessments')
      .insert([{
        ai_system_id: systemId,
        template,
        risk_level: assessmentData.risk_level,
        eu_ai_act_category: assessmentData.eu_ai_act_category,
        nist_score: assessmentData.nist_score,
        iso_readiness_score: assessmentData.iso_readiness_score,
        recommended_actions: assessmentData.recommended_actions,
        assessment_data: assessmentData,
      }])
      .select()
      .single();

    if (error) throw error;

    // Update system risk level
    await supabaseClient
      .from('ai_systems')
      .update({ risk_level: assessmentData.risk_level })
      .eq('id', systemId);

    // Create tasks from recommended actions
    if (assessmentData.recommended_actions && Array.isArray(assessmentData.recommended_actions)) {
      const tasks = assessmentData.recommended_actions.map((action: string) => ({
        title: action,
        description: `Action recommended from ${template} assessment`,
        assessment_id: savedAssessment.id,
        ai_system_id: systemId,
        status: 'open',
        priority: assessmentData.risk_level === 'high' || assessmentData.risk_level === 'critical' ? 'high' : 'medium',
      }));

      await supabaseClient.from('tasks').insert(tasks);
    }

    return new Response(JSON.stringify({ assessment: savedAssessment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in run-assessment function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});