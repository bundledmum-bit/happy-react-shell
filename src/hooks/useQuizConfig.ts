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
  display_order: number;
  is_active: boolean;
}

export interface QuizQuestion {
  id: string;
  step_id: string;
  question_text: string;
  sub_text: string | null;
  input_type: string;
  is_skippable: boolean;
  applies_to_path: string[];
  step_order: number;
  is_active: boolean;
  step_label: string | null;
  quiz_options: QuizOption[];
}

export interface QuizRoutingRule {
  id: string;
  from_step_id: string;
  condition_answer: string | null;
  condition_operator: string;
  next_step_id: string | null;
  priority: number;
  is_active: boolean;
  condition_field: string | null;
  description: string | null;
}

export interface QuizAdjustmentRule {
  id: string;
  rule_name: string;
  trigger_step: string;
  trigger_value: string;
  trigger_operator: string;
  target_product_slug: string | null;
  action: string;
  action_value: string | null;
  priority: number;
  is_active: boolean;
}

export interface QuizTargetCount {
  id: string;
  budget_tier: string;
  target_count: number;
  min_count: number;
  max_count: number;
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
      return (data || []) as QuizQuestion[];
    },
    staleTime: 0, // always re-fetch so admin changes take effect
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
      return (data || []) as QuizRoutingRule[];
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
      return (data || []) as QuizAdjustmentRule[];
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
      return (data || []) as QuizTargetCount[];
    },
    staleTime: 0,
  });
}

// All quiz config in one call for admin
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
        questions: (qRes.data || []) as QuizQuestion[],
        routingRules: (rRes.data || []) as QuizRoutingRule[],
        adjustmentRules: (aRes.data || []) as QuizAdjustmentRule[],
        targetCounts: (tRes.data || []) as QuizTargetCount[],
      };
    },
    staleTime: 0,
  });
}
