import { useState, useCallback, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllQuizConfig, type QuizQuestion, type QuizRoutingRule, type QuizAdjustmentRule, type QuizTargetCount } from "@/hooks/useQuizConfig";
import { useAdminUser } from "@/hooks/useAdminPermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Play, Save, Trash2, Plus, GripVertical, ChevronDown, ChevronRight, Download } from "lucide-react";
import ReactFlow, {
  Background, Controls, MiniMap, MarkerType,
  type Node, type Edge,
} from "reactflow";
import "reactflow/dist/style.css";

// ========= FLOWCHART TAB =========

function QuizFlowchart({ questions, routingRules }: { questions: QuizQuestion[]; routingRules: QuizRoutingRule[] }) {
  const nodes: Node[] = useMemo(() => {
    const n: Node[] = [];
    // Start node
    n.push({
      id: "__start__",
      type: "default",
      position: { x: 0, y: 200 },
      data: { label: "🟢 Quiz Start" },
      style: { background: "#22c55e", color: "#fff", borderRadius: 12, fontWeight: 700, padding: "8px 16px", border: "none" },
    });

    // Question nodes
    const selfSteps = questions.filter(q => !q.applies_to_path || q.applies_to_path.includes("self") || q.applies_to_path.includes("both"));
    const giftSteps = questions.filter(q => q.applies_to_path && q.applies_to_path.includes("gift") && !q.applies_to_path.includes("both") && !q.applies_to_path.includes("self"));

    let x = 250;
    questions.forEach((q, i) => {
      const isGiftOnly = q.applies_to_path && q.applies_to_path.includes("gift") && !q.applies_to_path.includes("both") && !q.applies_to_path.includes("self");
      n.push({
        id: q.step_id,
        type: "default",
        position: { x, y: isGiftOnly ? 450 : 200 },
        data: {
          label: (
            <div className="text-left">
              <div className="text-[10px] font-bold text-blue-200 uppercase">{q.step_id}</div>
              <div className="text-xs font-semibold">{q.question_text.slice(0, 40)}{q.question_text.length > 40 ? "..." : ""}</div>
              <div className="text-[9px] opacity-70 mt-0.5">{q.input_type} · {q.quiz_options.length} options{q.is_skippable ? " · skippable" : ""}</div>
            </div>
          ),
        },
        style: {
          background: isGiftOnly ? "#7c3aed" : "#3b82f6",
          color: "#fff",
          borderRadius: 10,
          padding: "6px 10px",
          border: q.is_active === false ? "2px dashed #666" : "none",
          minWidth: 180,
          maxWidth: 220,
        },
      });
      x += 280;
    });

    // End node
    n.push({
      id: "__end__",
      type: "default",
      position: { x: x, y: 300 },
      data: { label: "🔴 Show Results" },
      style: { background: "#ef4444", color: "#fff", borderRadius: 12, fontWeight: 700, padding: "8px 16px", border: "none" },
    });

    return n;
  }, [questions]);

  const edges: Edge[] = useMemo(() => {
    const e: Edge[] = [];

    // Start → first step
    if (questions.length > 0) {
      e.push({
        id: "start-to-first",
        source: "__start__",
        target: questions[0].step_id,
        animated: true,
        style: { stroke: "#22c55e" },
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    }

    // Routing rules as edges
    routingRules.forEach((rule) => {
      const target = rule.next_step_id === "__end__" ? "__end__" : rule.next_step_id;
      const isAlways = rule.condition_operator === "always";
      const label = isAlways ? "" : `${rule.condition_answer || ""}`;
      const isGiftRule = questions.find(q => q.step_id === rule.from_step_id)?.applies_to_path?.includes("gift");
      const isDadBoth = rule.from_step_id === "dadPurpose" && rule.condition_answer === "both";

      e.push({
        id: rule.id,
        source: rule.from_step_id,
        target: target,
        label: label ? label.slice(0, 20) : undefined,
        animated: isAlways || isDadBoth,
        style: {
          stroke: isDadBoth ? "#f97316" : isGiftRule ? "#7c3aed" : "#3b82f6",
          strokeDasharray: isAlways ? undefined : "5 5",
          strokeWidth: isDadBoth ? 2 : 1,
        },
        markerEnd: { type: MarkerType.ArrowClosed },
        labelStyle: { fontSize: 9, fill: isDadBoth ? "#f97316" : "#666" },
      });
    });

    // Special "both" path return arrow: push gift results → budget (family shopping)
    const hasDadPurpose = questions.some(q => q.step_id === "dadPurpose");
    const hasBudget = questions.some(q => q.step_id === "budget");
    if (hasDadPurpose && hasBudget) {
      e.push({
        id: "both-return-arrow",
        source: "__end__",
        target: "budget",
        label: "Then shop family →",
        animated: true,
        style: { stroke: "#f97316", strokeDasharray: "8 4", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed },
        labelStyle: { fontSize: 9, fill: "#f97316", fontWeight: 700 },
      });
    }

    return e;
  }, [routingRules, questions]);

  const downloadPNG = useCallback(() => {
    toast("PNG export coming soon — use browser screenshot for now");
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Quiz Flowchart</h2>
        <Button variant="outline" size="sm" onClick={downloadPNG}>
          <Download className="w-3.5 h-3.5 mr-1" /> Export PNG
        </Button>
      </div>
      <div className="border border-border rounded-xl overflow-hidden" style={{ height: 600 }}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#3b82f6]" /> Self path</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#7c3aed]" /> Gift path</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#22c55e]" /> Start</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#ef4444]" /> End</span>
      </div>
    </div>
  );
}

// ========= CONFIG EDITOR TAB =========

function QuestionsEditor({ questions, onRefresh }: { questions: QuizQuestion[]; onRefresh: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const saveQuestion = async (q: QuizQuestion) => {
    setSaving(q.id);
    const { error } = await supabase.from("quiz_questions").update({
      question_text: q.question_text,
      sub_text: q.sub_text,
      is_skippable: q.is_skippable,
      is_active: q.is_active,
      step_order: q.step_order,
    }).eq("id", q.id);
    if (error) toast.error("Failed to save");
    else toast.success("Question saved");
    setSaving(null);
    onRefresh();
  };

  const saveOption = async (opt: any) => {
    const { error } = await supabase.from("quiz_options").update({
      option_label: opt.option_label,
      option_emoji: opt.option_emoji,
      option_description: opt.option_description,
      price_modifier: opt.price_modifier,
      display_order: opt.display_order,
      is_active: opt.is_active,
    }).eq("id", opt.id);
    if (error) toast.error("Failed to save option");
    else toast.success("Option saved");
    onRefresh();
  };

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Questions & Options</h3>
      {questions.sort((a, b) => a.step_order - b.step_order).map(q => (
        <div key={q.id} className="border border-border rounded-lg bg-card">
          <button
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30"
            onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="font-mono text-[10px]">{q.step_id}</Badge>
            <span className="text-sm font-semibold flex-1 truncate">{q.question_text}</span>
            <Badge variant={q.is_active ? "default" : "secondary"} className="text-[10px]">{q.is_active ? "Active" : "Inactive"}</Badge>
            {expandedId === q.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {expandedId === q.id && (
            <div className="p-4 pt-0 border-t border-border space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Question Text</label>
                  <Input defaultValue={q.question_text} className="text-sm" onBlur={e => { q.question_text = e.target.value; }} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Sub Text</label>
                  <Input defaultValue={q.sub_text || ""} className="text-sm" onBlur={e => { q.sub_text = e.target.value; }} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={q.is_skippable ?? false} onCheckedChange={v => { q.is_skippable = v; }} />
                  Skippable
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={q.is_active ?? true} onCheckedChange={v => { q.is_active = v; }} />
                  Active
                </label>
                <Button size="sm" onClick={() => saveQuestion(q)} disabled={saving === q.id}>
                  {saving === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Save
                </Button>
              </div>

              <div className="mt-3">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase mb-2">Options ({q.quiz_options.length})</h4>
                <div className="space-y-1.5">
                  {q.quiz_options.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map(opt => (
                    <div key={opt.id} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
                      <Input defaultValue={opt.option_emoji || ""} className="w-12 text-center text-sm" onBlur={e => { opt.option_emoji = e.target.value; }} />
                      <Input defaultValue={opt.option_label} className="flex-1 text-sm" onBlur={e => { opt.option_label = e.target.value; }} />
                      <Input defaultValue={opt.option_description || ""} className="flex-1 text-sm" placeholder="Description" onBlur={e => { opt.option_description = e.target.value; }} />
                      <Input defaultValue={String(opt.price_modifier || 0)} className="w-20 text-sm" type="number" onBlur={e => { opt.price_modifier = Number(e.target.value) || null; }} />
                      <Button size="sm" variant="ghost" onClick={() => saveOption(opt)}>
                        <Save className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RoutingRulesEditor({ rules, questions, onRefresh }: { rules: QuizRoutingRule[]; questions: QuizQuestion[]; onRefresh: () => void }) {
  const stepIds = questions.map(q => q.step_id);

  const saveRule = async (rule: QuizRoutingRule) => {
    const { error } = await supabase.from("quiz_routing_rules").update({
      from_step_id: rule.from_step_id,
      condition_answer: rule.condition_answer,
      condition_operator: rule.condition_operator,
      next_step_id: rule.next_step_id,
      priority: rule.priority,
      is_active: rule.is_active,
    }).eq("id", rule.id);
    if (error) toast.error("Failed to save rule");
    else toast.success("Rule saved");
    onRefresh();
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this routing rule?")) return;
    await supabase.from("quiz_routing_rules").delete().eq("id", id);
    toast.success("Rule deleted");
    onRefresh();
  };

  const addRule = async () => {
    await supabase.from("quiz_routing_rules").insert({
      from_step_id: stepIds[0] || "shopper",
      next_step_id: stepIds[1] || "budget",
      condition_operator: "always",
      priority: 0,
    });
    toast.success("Rule added");
    onRefresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Routing Rules</h3>
        <Button size="sm" onClick={addRule}><Plus className="w-3 h-3 mr-1" /> Add Rule</Button>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From Step</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Next Step</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Active</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map(rule => (
              <TableRow key={rule.id}>
                <TableCell>
                  <select defaultValue={rule.from_step_id} className="border rounded px-2 py-1 text-xs bg-background" onChange={e => { rule.from_step_id = e.target.value; }}>
                    {stepIds.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </TableCell>
                <TableCell><Input defaultValue={rule.condition_answer || ""} className="w-28 text-xs" onBlur={e => { rule.condition_answer = e.target.value || null; }} /></TableCell>
                <TableCell>
                  <select defaultValue={rule.condition_operator || "always"} className="border rounded px-2 py-1 text-xs bg-background" onChange={e => { rule.condition_operator = e.target.value; }}>
                    {["always", "equals", "not_equals", "contains", "not_contains", "is_any", "is_none"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </TableCell>
                <TableCell>
                  <select defaultValue={rule.next_step_id} className="border rounded px-2 py-1 text-xs bg-background" onChange={e => { rule.next_step_id = e.target.value; }}>
                    {[...stepIds, "__end__"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </TableCell>
                <TableCell><Input defaultValue={String(rule.priority || 0)} type="number" className="w-16 text-xs" onBlur={e => { rule.priority = Number(e.target.value); }} /></TableCell>
                <TableCell><Switch checked={rule.is_active ?? true} onCheckedChange={v => { rule.is_active = v; saveRule(rule); }} /></TableCell>
                <TableCell className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => saveRule(rule)}><Save className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteRule(rule.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AdjustmentRulesEditor({ rules, onRefresh }: { rules: QuizAdjustmentRule[]; onRefresh: () => void }) {
  const saveRule = async (rule: QuizAdjustmentRule) => {
    const { error } = await supabase.from("quiz_adjustment_rules").update({
      rule_name: rule.rule_name,
      trigger_step_id: rule.trigger_step_id,
      trigger_value: rule.trigger_value,
      trigger_operator: rule.trigger_operator,
      target_product_slug: rule.target_product_slug,
      action: rule.action,
      action_value: rule.action_value,
      priority: rule.priority,
      is_active: rule.is_active,
    }).eq("id", rule.id);
    if (error) toast.error("Failed to save");
    else toast.success("Saved");
    onRefresh();
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Adjustment Rules</h3>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule Name</TableHead>
              <TableHead>Trigger Step</TableHead>
              <TableHead>Trigger Value</TableHead>
              <TableHead>Target Product</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action Value</TableHead>
              <TableHead>Active</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map(rule => (
              <TableRow key={rule.id}>
                <TableCell><Input defaultValue={rule.rule_name} className="w-32 text-xs" onBlur={e => { rule.rule_name = e.target.value; }} /></TableCell>
                <TableCell><Input defaultValue={rule.trigger_step_id} className="w-28 text-xs" onBlur={e => { rule.trigger_step_id = e.target.value; }} /></TableCell>
                <TableCell><Input defaultValue={rule.trigger_value} className="w-24 text-xs" onBlur={e => { rule.trigger_value = e.target.value; }} /></TableCell>
                <TableCell><Input defaultValue={rule.target_product_slug} className="w-32 text-xs" onBlur={e => { rule.target_product_slug = e.target.value; }} /></TableCell>
                <TableCell><Input defaultValue={rule.action} className="w-24 text-xs" onBlur={e => { rule.action = e.target.value; }} /></TableCell>
                <TableCell><Input defaultValue={rule.action_value || ""} className="w-24 text-xs" onBlur={e => { rule.action_value = e.target.value; }} /></TableCell>
                <TableCell><Switch checked={rule.is_active ?? true} onCheckedChange={v => { rule.is_active = v; saveRule(rule); }} /></TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => saveRule(rule)}><Save className="w-3 h-3" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TargetCountsEditor({ counts, onRefresh }: { counts: QuizTargetCount[]; onRefresh: () => void }) {
  const saveCount = async (c: QuizTargetCount) => {
    const { error } = await supabase.from("quiz_target_counts").update({
      target_count: c.target_count,
      min_count: c.min_count,
      max_count: c.max_count,
    }).eq("id", c.id);
    if (error) toast.error("Failed to save");
    else toast.success("Saved");
    onRefresh();
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Target Counts per Budget Tier</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Budget Tier</TableHead>
            <TableHead>Target Count</TableHead>
            <TableHead>Min Count</TableHead>
            <TableHead>Max Count</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {counts.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-semibold capitalize">{c.budget_tier}</TableCell>
              <TableCell><Input defaultValue={String(c.target_count)} type="number" className="w-20 text-sm" onBlur={e => { c.target_count = Number(e.target.value); }} /></TableCell>
              <TableCell><Input defaultValue={String(c.min_count)} type="number" className="w-20 text-sm" onBlur={e => { c.min_count = Number(e.target.value); }} /></TableCell>
              <TableCell><Input defaultValue={String(c.max_count)} type="number" className="w-20 text-sm" onBlur={e => { c.max_count = Number(e.target.value); }} /></TableCell>
              <TableCell><Button size="sm" onClick={() => saveCount(c)}><Save className="w-3 h-3 mr-1" /> Save</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EngineTestPanel() {
  const [params, setParams] = useState({
    p_budget_tier: "standard",
    p_scope: "hospital-bag+general",
    p_stage: "expecting",
    p_hospital_type: "both",
    p_delivery_method: "both",
    p_multiples: 1,
    p_gender: "neutral",
    p_first_baby: false,
    p_shopper_type: "self",
    p_gift_for: "",
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("run_quiz_recommendation", {
        ...params,
        p_gift_for: params.p_gift_for || null,
      });
      if (error) throw error;
      setResult(data);
      toast.success("Engine test completed");
    } catch (err: any) {
      toast.error(err.message || "Engine error");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Test the Engine</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { key: "p_budget_tier", label: "Budget Tier", options: ["starter", "standard", "premium"] },
          { key: "p_scope", label: "Scope", options: ["hospital-bag", "hospital-bag+general", "general"] },
          { key: "p_stage", label: "Stage", options: ["expecting", "newborn", "0-3m", "3-6m", "6-12m"] },
          { key: "p_hospital_type", label: "Hospital Type", options: ["public", "private", "both"] },
          { key: "p_delivery_method", label: "Delivery Method", options: ["vaginal", "csection", "both"] },
          { key: "p_gender", label: "Gender", options: ["boy", "girl", "neutral", "mixed"] },
          { key: "p_shopper_type", label: "Shopper Type", options: ["self", "gift"] },
        ].map(field => (
          <div key={field.key}>
            <label className="text-[11px] font-semibold text-muted-foreground">{field.label}</label>
            <select
              value={(params as any)[field.key]}
              onChange={e => setParams(p => ({ ...p, [field.key]: e.target.value }))}
              className="w-full border rounded px-2 py-1.5 text-sm bg-background"
            >
              {field.options.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">Multiples</label>
          <Input type="number" value={params.p_multiples} onChange={e => setParams(p => ({ ...p, p_multiples: Number(e.target.value) || 1 }))} />
        </div>
        <div>
          <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground mt-5">
            <Switch checked={params.p_first_baby} onCheckedChange={v => setParams(p => ({ ...p, p_first_baby: v }))} />
            First Baby
          </label>
        </div>
      </div>
      <Button onClick={runTest} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
        Run Test
      </Button>
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground">Products</div>
              <div className="text-xl font-bold">{result.product_count}</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground">Target</div>
              <div className="text-xl font-bold">{result.target_count}</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground">Engine</div>
              <div className="text-xs font-mono">{result.engine_version}</div>
            </div>
          </div>
          {result.products?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {result.products.map((p: any) => (
                <div key={p.product_id} className="border rounded-lg p-2 text-xs">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-muted-foreground">{p.brand?.brand_name} · ₦{p.brand?.price?.toLocaleString()}</div>
                  <div className="text-muted-foreground">{p.priority} · qty: {p.quantity}</div>
                </div>
              ))}
            </div>
          )}
          <details>
            <summary className="text-xs text-muted-foreground cursor-pointer">Raw JSON</summary>
            <pre className="mt-2 bg-muted rounded-lg p-3 text-[10px] overflow-auto max-h-80">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

// ========= MAIN ADMIN QUIZ ENGINE =========

export default function AdminQuizEngine() {
  const { data: adminUser } = useAdminUser();
  const { data: config, isLoading, refetch } = useAllQuizConfig();
  const qc = useQueryClient();
  const isSuperAdmin = adminUser?.role === "super_admin";

  const onRefresh = useCallback(() => {
    refetch();
    qc.invalidateQueries({ queryKey: ["quiz_questions"] });
    qc.invalidateQueries({ queryKey: ["quiz_routing_rules"] });
  }, [refetch, qc]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel("admin-quiz-config")
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_questions" }, () => onRefresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_routing_rules" }, () => onRefresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_adjustment_rules" }, () => onRefresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [onRefresh]);

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { questions, routingRules, adjustmentRules, targetCounts } = config;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quiz Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage quiz flow, routing rules, and test the recommendation engine.
        </p>
      </div>

      <Tabs defaultValue="flowchart">
        <TabsList>
          <TabsTrigger value="flowchart">Flowchart</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="config">Config Editor</TabsTrigger>}
        </TabsList>

        <TabsContent value="flowchart">
          <QuizFlowchart questions={questions} routingRules={routingRules} />
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="config" className="space-y-8">
            <QuestionsEditor questions={[...questions]} onRefresh={onRefresh} />
            <RoutingRulesEditor rules={[...routingRules]} questions={questions} onRefresh={onRefresh} />
            <AdjustmentRulesEditor rules={[...adjustmentRules]} onRefresh={onRefresh} />
            <TargetCountsEditor counts={[...targetCounts]} onRefresh={onRefresh} />
            <EngineTestPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
