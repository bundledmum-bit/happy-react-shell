/**
 * Database-driven quiz routing engine.
 * All logic comes from quiz_routing_rules in Supabase.
 */

import type { QuizQuestion, QuizRoutingRule } from "@/hooks/useQuizConfig";

type Answers = Record<string, string>;

function evaluateCondition(
  rule: QuizRoutingRule,
  currentAnswer: string,
  _allAnswers: Answers
): boolean {
  const op = rule.condition_operator || "always";
  const condVal = rule.condition_answer || "";

  if (op === "always") return true;

  switch (op) {
    case "equals":
      return currentAnswer === condVal;
    case "not_equals":
      return currentAnswer !== condVal;
    case "contains":
      return currentAnswer.includes(condVal);
    case "not_contains":
      return !currentAnswer.includes(condVal);
    case "is_any":
      return condVal.split(",").map(s => s.trim()).includes(currentAnswer);
    case "is_none":
      return !condVal.split(",").map(s => s.trim()).includes(currentAnswer);
    default:
      return false;
  }
}

/**
 * Determine the next step based on routing rules from the database.
 * Returns the next step_id, or null if quiz is complete.
 */
export function getNextStep(
  currentStepId: string,
  currentAnswer: string,
  allAnswers: Answers,
  routingRules: QuizRoutingRule[],
  questions: QuizQuestion[]
): string | null {
  const rulesForStep = routingRules
    .filter(r => r.from_step_id === currentStepId)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const shopperType = allAnswers.shopper || "self";

  // Special dad-path handling: gender → wifeStage
  if (currentStepId === "gender" && shopperType === "dad") {
    const dadRule = rulesForStep.find(r => r.condition_answer === "dad");
    if (dadRule) {
      const nextId = dadRule.next_step_id;
      if (!nextId || nextId === "__end__") return null;
      return nextId;
    }
  }

  for (const rule of rulesForStep) {
    if (evaluateCondition(rule, currentAnswer, allAnswers)) {
      const nextId = rule.next_step_id;
      if (!nextId || nextId === "__end__") return null;

      // Check if target step applies to current path
      const targetStep = questions.find(q => q.step_id === nextId);
      if (!targetStep) {
        // Step is inactive — recurse through it
        // First try to find any "always" rule from this step
        const alwaysRule = routingRules.find(
          r => r.from_step_id === nextId && r.condition_operator === "always" && r.is_active !== false
        );
        if (alwaysRule) {
          return getNextStep(alwaysRule.next_step_id, "", allAnswers, routingRules, questions);
        }
        // No always rule — follow the highest priority rule regardless of condition
        const fallbackRules = routingRules
          .filter(r => r.from_step_id === nextId && r.is_active !== false)
          .sort((a, b) => (b.priority || 0) - (a.priority || 0));
        if (fallbackRules.length > 0) {
          const fallbackNext = fallbackRules[0].next_step_id;
          if (!fallbackNext || fallbackNext === "__end__") return null;
          return getNextStep(fallbackNext, "", allAnswers, routingRules, questions);
        }
        // No rules at all from this step — quiz ends
        return null;
      }
      const applyTo = targetStep.applies_to_path;
      if (
        applyTo && applyTo.length > 0 &&
        !applyTo.includes(shopperType) && !applyTo.includes("both")
      ) {
        // Skip this step — path mismatch, recurse to find next valid one
        return getNextStep(nextId, "", allAnswers, routingRules, questions);
      }
      return nextId;
    }
  }

  return null;
}

/**
 * Build the full step sequence for breadcrumb display.
 */
export function getStepSequence(
  answers: Answers,
  routingRules: QuizRoutingRule[],
  questions: QuizQuestion[]
): string[] {
  if (!questions.length) return [];
  const firstStep = questions[0]?.step_id;
  if (!firstStep) return [];
  const steps: string[] = [firstStep];
  let current = firstStep;
  for (let i = 0; i < 30; i++) {
    const ans = answers[current] || "";
    const next = getNextStep(current, ans, answers, routingRules, questions);
    if (!next) break;
    steps.push(next);
    current = next;
  }
  return steps;
}

/**
 * Add "mixed" option for gender if multiples >= 2
 */
export function getModifiedOptions(
  question: QuizQuestion,
  answers: Answers
): QuizQuestion {
  if (question.step_id === "gender") {
    const multiples = parseInt(answers.multiples || "1");
    if (multiples >= 2 && !question.quiz_options.some(o => o.option_value === "mixed")) {
      return {
        ...question,
        quiz_options: [
          ...question.quiz_options,
          {
            id: "mixed-dynamic",
            question_id: question.id,
            option_value: "mixed",
            option_label: "One of each",
            option_emoji: "👦👧",
            option_description: "Mixed colours",
            price_modifier: null,
            display_order: 99,
            is_active: true,
          },
        ],
      };
    }
  }
  return question;
}
