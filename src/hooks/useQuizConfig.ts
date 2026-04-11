import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface QuizOption {
  id: string;
  question_id: string;
  option_value: string;
  option_label: string;
  option_emoji: string | null;
  option_description: string | null;
  price_modifier: number | null;
  display_order: number | null;
  is_active: boolean | null;
}

export interface QuizQuestionUiConfig {
  page_title?: string;
  eyebrow?: string;
  placeholder?: string;
  helper_text?: string;
  primary_button?: string;
  skip_label?: string;
  footer_text?: string;
  validation_regex?: string;
  validation_error?: string;
}

export interface QuizQuestion {
  id: string;
  step_id: string;
  question_text: string;
  sub_text: string | null;
  input_type: string;
  is_skippable: boolean | null;
  applies_to_path: string[] | null;
  step_order: number;
  step_label: string;
  is_active: boolean | null;
  ui_config: QuizQuestionUiConfig | null;
  quiz_options: QuizOption[];
}

export interface QuizRoutingRule {
  id: string;
  from_step_id: string;
  condition_answer: string | null;
  condition_operator: string | null;
  next_step_id: string;
  priority: number | null;
  is_active: boolean | null;
}

export interface QuizAdjustmentRule {
  id: string;
  rule_name: string;
  trigger_step_id: string;
  trigger_value: string;
  trigger_operator: string | null;
  target_product_slug: string;
  action: string;
  action_value: string | null;
  priority: number | null;
  is_active: boolean | null;
}

export interface QuizTargetCount {
  id: string;
  budget_tier: string;
  target_count: number;
  min_count: number;
  max_count: number;
  is_active: boolean | null;
}

export function useQuizQuestions() {
  return useQuery({
    queryKey: ["quiz_questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*, quiz_options(*)")
        .eq("is_active", true)
        .order("step_order");
      if (error) throw error;
      return (data || []) as unknown as QuizQuestion[];
    },
    staleTime: 0,
  });
}

export function useQuizRoutingRules() {
  return useQuery({
    queryKey: ["quiz_routing_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_routing_rules")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as QuizRoutingRule[];
    },
    staleTime: 0,
  });
}

export function useQuizAdjustmentRules() {
  return useQuery({
    queryKey: ["quiz_adjustment_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_adjustment_rules")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as QuizAdjustmentRule[];
    },
    staleTime: 0,
  });
}

export function useQuizTargetCounts() {
  return useQuery({
    queryKey: ["quiz_target_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_target_counts")
        .select("*");
      if (error) throw error;
      return (data || []) as unknown as QuizTargetCount[];
    },
    staleTime: 0,
  });
}

export function useAllQuizConfig() {
  return useQuery({
    queryKey: ["quiz_all_config"],
    queryFn: async () => {
      const [qRes, rRes, aRes, tRes] = await Promise.all([
        supabase.from("quiz_questions").select("*, quiz_options(*)").order("step_order"),
        supabase.from("quiz_routing_rules").select("*").order("priority", { ascending: false }),
        supabase.from("quiz_adjustment_rules").select("*").order("priority", { ascending: false }),
        supabase.from("quiz_target_counts").select("*"),
      ]);
      return {
        questions: (qRes.data || []) as unknown as QuizQuestion[],
        routingRules: (rRes.data || []) as unknown as QuizRoutingRule[],
        adjustmentRules: (aRes.data || []) as unknown as QuizAdjustmentRule[],
        targetCounts: (tRes.data || []) as unknown as QuizTargetCount[],
      };
    },
    staleTime: 0,
  });
}
