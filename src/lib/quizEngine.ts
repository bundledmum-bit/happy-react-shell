/**
 * Database-driven quiz routing engine.
 * All logic comes from quiz_routing_rules in Supabase.
 */

import type { QuizQuestion, QuizRoutingRule } from "@/hooks/useQuizConfig";

type Answers = Record<string, string>;

function evaluateCondition(
  rule: QuizRoutingRule,
  currentAnswer: string,
  allAnswers: Answers
): boolean {
  const op = rule.condition_operator;
  const condVal = rule.condition_answer || "";
  
  // "always" matches unconditionally
  if (op === "always") return true;

  // Determine the value to check against
  const checkField = rule.condition_field || null;
  const valueToCheck = checkField ? (allAnswers[checkField] || "") : currentAnswer;

  switch (op) {
    case "equals":
      return valueToCheck === condVal;
    case "not_equals":
      return valueToCheck !== condVal;
    case "contains":
      return valueToCheck.includes(condVal);
    case "not_contains":
      return !valueToCheck.includes(condVal);
    case "is_any":
      return condVal.split(",").map(s => s.trim()).includes(valueToCheck);
    case "is_none":
      return !condVal.split(",").map(s => s.trim()).includes(valueToCheck);
    default:
      return false;
  }
}

/**
 * Determine the next step based on routing rules from the database.
 * Returns the next step_id, or null if quiz is complete (show results).
 */
export function getNextStep(
  currentStepId: string,
  currentAnswer: string,
  allAnswers: Answers,
  routingRules: QuizRoutingRule[],
  questions: QuizQuestion[]
): string | null {
  // Get all rules for the current step, already sorted by priority desc
  const rulesForStep = routingRules.filter(r => r.from_step_id === currentStepId);

  for (const rule of rulesForStep) {
    if (evaluateCondition(rule, currentAnswer, allAnswers)) {
      const nextId = rule.next_step_id;
      // null means end of quiz
      if (!nextId) return null;
      
      // Verify the target step exists and is active
      const targetStep = questions.find(q => q.step_id === nextId);
      if (targetStep) {
        // Check applies_to_path filter
        const path = allAnswers.shopper === "gift" ? "gift" : "self";
        if (
          targetStep.applies_to_path &&
          targetStep.applies_to_path.length > 0 &&
          !targetStep.applies_to_path.includes(path) &&
          !targetStep.applies_to_path.includes("both")
        ) {
          // This step doesn't apply to current path, skip to next rule
          continue;
        }
        return nextId;
      }
    }
  }

  // No matching rule found — quiz is complete
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
  const maxIter = 30; // safety
  
  for (let i = 0; i < maxIter; i++) {
    const ans = answers[current] || "";
    const next = getNextStep(current, ans, answers, routingRules, questions);
    if (!next) break;
    steps.push(next);
    current = next;
  }
  
  return steps;
}

/**
 * Get dynamic gender options — add "mixed" for multiples >= 2
 */
export function getModifiedOptions(
  question: QuizQuestion,
  answers: Answers
): QuizQuestion {
  if (question.step_id === "gender") {
    const multiples = parseInt(answers.multiples || "1");
    if (multiples >= 2) {
      const hasOption = question.quiz_options.some(o => o.option_value === "mixed");
      if (!hasOption) {
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
  }
  return question;
}
