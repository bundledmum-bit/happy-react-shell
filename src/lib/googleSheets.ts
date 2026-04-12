import { supabase } from "@/integrations/supabase/client";

const DEFAULT_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycby3mFQQ9oORQeiCKyd1hWaxx0m9n6T4mSQl3hb1DgyD--0UrKiUE_Qvnh0pV4Jp_janXw/exec";

export interface OrderSheetFallbackData {
  timestamp: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  deliveryNotes: string;
  itemsSummary: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  giftWrap: boolean;
  giftWrapFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  paystackRef: string | null;
}

interface SyncOrderToSheetsParams {
  orderId: string;
  orderNumber: string | null;
  fallbackData: OrderSheetFallbackData;
}

interface SheetsDbOrder {
  order_number: string | null;
  created_at: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_notes: string | null;
  payment_status: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  paystack_transaction_id: string | null;
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  total: number;
  gift_wrapping: boolean | null;
  order_status: string | null;
}

interface SheetsDbOrderItem {
  product_name: string;
  quantity: number;
  brand_name: string;
  size: string | null;
}

const stringifyValue = (value: unknown) => {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
};

const normalizePaymentStatus = (
  dbPaymentStatus: string | null | undefined,
  fallbackPaymentStatus: string,
  paymentMethod: string,
) => {
  if (fallbackPaymentStatus) return fallbackPaymentStatus;
  if (!dbPaymentStatus) return "";
  if (paymentMethod === "transfer" && dbPaymentStatus === "pending") return "PENDING_TRANSFER";
  return dbPaymentStatus.toUpperCase();
};

const formatItemsSummary = (items: SheetsDbOrderItem[]) =>
  items
    .map(({ product_name, quantity, brand_name, size }) => {
      const details = [brand_name, size ? `Size: ${size}` : ""].filter(Boolean).join(" · ");
      return details ? `${product_name} x${quantity} (${details})` : `${product_name} x${quantity}`;
    })
    .join(", ");

export async function syncOrderToSheets({ orderId, orderNumber, fallbackData }: SyncOrderToSheetsParams) {
  const url = import.meta.env.VITE_SHEETS_WEBHOOK_URL || DEFAULT_SHEETS_WEBHOOK_URL;
  if (!url) return;

  let dbOrder: SheetsDbOrder | null = null;
  let dbItems: SheetsDbOrderItem[] | null = null;

  try {
    const [{ data: orderData, error: orderError }, { data: itemData, error: itemError }] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "order_number, created_at, customer_name, customer_email, customer_phone, delivery_address, delivery_city, delivery_state, delivery_notes, payment_status, payment_method, payment_reference, paystack_transaction_id, subtotal, delivery_fee, service_fee, total, gift_wrapping, order_status",
        )
        .eq("id", orderId)
        .maybeSingle(),
      supabase
        .from("order_items")
        .select("product_name, quantity, brand_name, size")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true }),
    ]);

    if (orderError) console.error("Google Sheets order fetch failed:", orderError);
    if (itemError) console.error("Google Sheets order items fetch failed:", itemError);

    dbOrder = (orderData as SheetsDbOrder | null) ?? null;
    dbItems = (itemData as SheetsDbOrderItem[] | null) ?? null;
  } catch (error) {
    console.error("Google Sheets preload failed:", error);
  }

  const resolvedOrderNumber = dbOrder?.order_number || orderNumber || orderId;
  const resolvedPaymentMethod = dbOrder?.payment_method || fallbackData.paymentMethod || "";
  const resolvedPaymentStatus = normalizePaymentStatus(
    dbOrder?.payment_status,
    fallbackData.paymentStatus,
    resolvedPaymentMethod,
  );
  const resolvedTimestamp = dbOrder?.created_at || fallbackData.timestamp || new Date().toISOString();
  const resolvedPaystackRef =
    dbOrder?.paystack_transaction_id || dbOrder?.payment_reference || fallbackData.paystackRef || "N/A";
  const resolvedHasGiftWrap =
    typeof dbOrder?.gift_wrapping === "boolean" ? dbOrder.gift_wrapping : fallbackData.giftWrap;
  const resolvedGiftWrapFee = resolvedHasGiftWrap ? fallbackData.giftWrapFee || 0 : 0;
  const resolvedEmail = dbOrder?.customer_email || fallbackData.email || "";
  const resolvedPhone = dbOrder?.customer_phone || fallbackData.phone || "";
  const resolvedAddress = dbOrder?.delivery_address || fallbackData.address || "";
  const resolvedCity = dbOrder?.delivery_city || fallbackData.city || "";
  const resolvedState = dbOrder?.delivery_state || fallbackData.state || "";
  const resolvedNotes = dbOrder?.delivery_notes || fallbackData.deliveryNotes || "None";
  const resolvedItemsSummary = dbItems?.length ? formatItemsSummary(dbItems) : fallbackData.itemsSummary || "";

  const payload = {
    order_id: resolvedOrderNumber,
    order_number: resolvedOrderNumber,
    orderId: resolvedOrderNumber,
    orderNumber: resolvedOrderNumber,
    date_time: resolvedTimestamp,
    dateTime: resolvedTimestamp,
    order_date: resolvedTimestamp,
    created_at: resolvedTimestamp,
    payment_status: resolvedPaymentStatus,
    paymentStatus: resolvedPaymentStatus,
    payment_method: resolvedPaymentMethod,
    paymentMethod: resolvedPaymentMethod,
    paystack_ref: resolvedPaystackRef,
    paystack_reference: resolvedPaystackRef,
    payment_reference: resolvedPaystackRef,
    customer_name: dbOrder?.customer_name || fallbackData.customerName || "",
    customerName: dbOrder?.customer_name || fallbackData.customerName || "",
    customer_email: resolvedEmail,
    customerEmail: resolvedEmail,
    email: resolvedEmail,
    phone: resolvedPhone,
    customer_phone: resolvedPhone,
    delivery_address: resolvedAddress,
    deliveryAddress: resolvedAddress,
    address: resolvedAddress,
    city: resolvedCity,
    delivery_city: resolvedCity,
    state: resolvedState,
    delivery_state: resolvedState,
    notes: resolvedNotes,
    delivery_notes: resolvedNotes,
    items: resolvedItemsSummary,
    items_summary: resolvedItemsSummary,
    subtotal: dbOrder?.subtotal ?? fallbackData.subtotal ?? 0,
    delivery_fee: dbOrder?.delivery_fee ?? fallbackData.deliveryFee ?? 0,
    service_fee: dbOrder?.service_fee ?? fallbackData.serviceFee ?? 0,
    gift_wrap_fee: resolvedGiftWrapFee,
    giftWrapFee: resolvedGiftWrapFee,
    gift_wrap: resolvedGiftWrapFee,
    total: dbOrder?.total ?? fallbackData.total ?? 0,
    order_status: dbOrder?.order_status || "confirmed",
  };

  const targetUrl = new URL(url);
  Object.entries(payload).forEach(([key, value]) => targetUrl.searchParams.set(key, stringifyValue(value)));

  try {
    await fetch(targetUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (error) {
    console.error("Sheet logging failed:", error);
  }
}