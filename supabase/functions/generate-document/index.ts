import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestSchema = z.object({
      systemId: z.string().uuid({ message: "Invalid system ID format" }),
      assessmentId: z.string().uuid({ message: "Invalid assessment ID format" }).optional(),
      type: z.enum(['acceptable_use_policy', 'system_card', 'risk_summary'], {
        errorMap: () => ({ message: "Invalid document type" })
      })
    });

    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request parameters", details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { systemId, assessmentId, type } = validationResult.data;
    
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

    // Fetch assessment data if provided
    let assessment = null;
    if (assessmentId) {
      const { data } = await supabaseClient
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();
      assessment = data;
    }

    // Prepare prompts based on document type
    let systemPrompt = "";
    let userPrompt = "";

    if (type === "acceptable_use_policy") {
      systemPrompt = "You are an AI governance expert. Create a professional Acceptable Use Policy for AI systems.";
      userPrompt = `Create an AI Acceptable Use Policy for the following system:

System Name: ${system.name}
Description: ${system.description}
Business Unit: ${system.business_unit}
Data Type: ${system.data_type}
Model Type: ${system.model_type}

Include sections on:
1. Purpose and Scope
2. Permitted Uses
3. Prohibited Uses
4. User Responsibilities
5. Monitoring and Compliance
6. Consequences of Violation

Format the response as a professional policy document with clear sections.`;
    } else if (type === "system_card") {
      systemPrompt = "You are an AI documentation specialist. Create detailed AI system documentation cards.";
      userPrompt = `Create an AI System Card for:

System Name: ${system.name}
Description: ${system.description}
Owner: ${system.owner}
Business Unit: ${system.business_unit}
Geography: ${system.geography}
Data Type: ${system.data_type}
Model Type: ${system.model_type}
Training Source: ${system.training_source}
Deployment Environment: ${system.deployment_environment}
Risk Level: ${system.risk_level}

Include sections on:
1. System Overview
2. Intended Use and Applications
3. Model Architecture and Training
4. Data Handling and Privacy
5. Performance Metrics
6. Limitations and Risks
7. Responsible AI Considerations

Format as a comprehensive system card.`;
    } else if (type === "risk_summary") {
      systemPrompt = "You are an AI risk assessment expert. Create comprehensive risk summaries.";
      userPrompt = `Create a Risk Summary for:

System: ${system.name}
Risk Level: ${system.risk_level}
${assessment ? `
EU AI Act Category: ${assessment.eu_ai_act_category}
NIST Score: ${assessment.nist_score}
ISO Readiness: ${assessment.iso_readiness_score}
Recommended Actions: ${assessment.recommended_actions?.join(', ')}
` : ''}

Include sections on:
1. Executive Summary
2. Risk Classification
3. Key Risk Factors
4. Regulatory Implications
5. Mitigation Strategies
6. Action Plan

Format as an executive-ready risk document.`;
    }

    // Call Lovable AI Gateway
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
      console.error('AI Gateway error:', response.status);
      throw new Error('Failed to generate document');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-document function:', error);
    return new Response(
      JSON.stringify({ error: "An error occurred generating your document" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});