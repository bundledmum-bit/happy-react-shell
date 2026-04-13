import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { order, items, customer, quiz } = body;

    if (!order || !items || !customer) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Insert order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert(order)
      .select("id, order_number")
      .single();

    if (orderError || !orderData) {
      console.error("Order insert failed:", orderError);
      return new Response(
        JSON.stringify({ error: orderError?.message || "Order insert failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. If trigger hasn't populated order_number yet, poll for it
    let finalOrderNumber = orderData.order_number;
    if (!finalOrderNumber) {
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 800));
        const { data: refetched } = await supabase
          .from("orders")
          .select("order_number")
          .eq("id", orderData.id)
          .single();
        if (refetched?.order_number) {
          finalOrderNumber = refetched.order_number;
          break;
        }
      }
    }

    // 3. Insert order items
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const toUuidOrNull = (val: unknown): string | null => {
      if (typeof val === "string" && uuidRegex.test(val)) return val;
      return null;
    };

    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      product_name: item.name,
      brand_name: item.brandName || "Standard",
      brand_id: toUuidOrNull(item.brandId),
      product_id: toUuidOrNull(item.productId),
      quantity: item.qty,
      unit_price: item.price,
      line_total: item.price * item.qty,
      size: item.size || null,
      color: item.color || null,
      bundle_name: item.bundleName || null,
    }));

    try {
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) {
        console.error(`[place-order] order_items insert FAILED for order ${orderData.id}:`, itemsError.message, itemsError);
      }
    } catch (itemsCatch) {
      console.error(`[place-order] order_items insert EXCEPTION for order ${orderData.id}:`, itemsCatch);
    }

    // 4. Upsert customer
    try {
      const { data: existing } = await supabase
        .from("customers")
        .select("id, total_orders, total_spent")
        .eq("email", customer.email)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("customers")
          .update({
            full_name: customer.name,
            phone: customer.phone,
            delivery_address: customer.address,
            delivery_area: customer.city,
            delivery_state: customer.state,
            total_orders: (existing.total_orders || 0) + 1,
            total_spent: (existing.total_spent || 0) + order.total,
            last_order_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("customers").insert({
          email: customer.email,
          full_name: customer.name,
          phone: customer.phone,
          delivery_address: customer.address,
          delivery_area: customer.city,
          delivery_state: customer.state,
          total_orders: 1,
          total_spent: order.total,
          last_order_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("Customer upsert failed:", e);
    }

    // 5. Mark quiz lead as purchased if applicable
    if (quiz?.sessionId) {
      try {
        await supabase.rpc("mark_quiz_lead_purchased", {
          p_session_id: quiz.sessionId,
          p_order_id: orderData.id,
          p_order_amount: order.total,
        });
      } catch (e) {
        console.error("Quiz lead update failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        id: orderData.id,
        order_number: finalOrderNumber,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("place-order error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
