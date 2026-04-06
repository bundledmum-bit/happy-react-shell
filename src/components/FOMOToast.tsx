import { useState, useEffect } from "react";
import { X } from "lucide-react";

const NOTIFICATIONS = [
  { name: "Ngozi", city: "Abuja", action: "just ordered", item: "a Standard Boy Bundle" },
  { name: "Adaeze", city: "Lagos", action: "just completed", item: "the hospital bag quiz" },
  { name: "Chioma", city: "Port Harcourt", action: "just added", item: "Baby Skincare Set to cart" },
  { name: "Blessing", city: "Lagos", action: "just ordered", item: "a Premium C-Section Bundle" },
  { name: "Funke", city: "Ibadan", action: "just completed", item: "the hospital bag quiz" },
  { name: "Amara", city: "Enugu", action: "just ordered", item: "a Gift Bundle" },
  { name: "Zainab", city: "Kano", action: "just added", item: "Newborn Onesie Set to cart" },
  { name: "Ifeoma", city: "Benin", action: "just ordered", item: "a Standard Girl Bundle" },
];

export default function FOMOToast() {
  const [current, setCurrent] = useState<typeof NOTIFICATIONS[0] | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    let idx = Math.floor(Math.random() * NOTIFICATIONS.length);
    const show = () => {
      setCurrent(NOTIFICATIONS[idx % NOTIFICATIONS.length]);
      setVisible(true);
      idx++;
      setTimeout(() => setVisible(false), 5000);
    };

    const initial = setTimeout(show, 8000);
    const interval = setInterval(show, 35000 + Math.random() * 10000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [dismissed]);

  if (!current || dismissed) return null;

  return (
    <div className={`fixed bottom-20 left-4 z-[90] transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
      <div className="bg-card rounded-xl shadow-lg border border-border p-3 pr-8 max-w-[300px] relative">
        <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-text-light hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">🛒</span>
          <div>
            <p className="text-xs font-semibold">
              {current.name} from {current.city} {current.action}
            </p>
            <p className="text-text-med text-[11px]">{current.item}</p>
            <p className="text-text-light text-[10px]">{Math.floor(Math.random() * 5) + 1} minutes ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
