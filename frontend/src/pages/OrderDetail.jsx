import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Download } from "lucide-react";
import { api } from "@/lib/api";
import { Widget } from "@/components/Widget";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtMoney, fmtDate } from "@/components/OrdersTable";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [o, setO] = useState(null);
  useEffect(() => { api.get(`/orders/${id}`).then((r) => setO(r.data)).catch(() => navigate("/dashboard/orders")); }, [id, navigate]);
  if (!o) return null;
  const b = o.breakdown;

  const Row = ({ label, value, accent }) => (
    <div className="flex items-center justify-between px-6 py-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className={accent || "text-white"}>{value}</span>
    </div>
  );

  return (
    <div className="max-w-4xl">
      <button data-testid="order-back-btn" onClick={() => navigate("/dashboard/orders")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Orders</button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-mono-plex text-xs text-zinc-500">{o.id}</p>
          <h1 className="font-display text-3xl font-light tracking-tighter sm:text-4xl">Receipt</h1>
          <p className="mt-2 text-sm text-zinc-400">{o.product} · {fmtDate(o.date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={o.status} />
          <button data-testid="order-download-btn" onClick={() => toast.info("Receipt generation coming soon")} className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-[#0066FF]/50 hover:text-white"><Download className="h-4 w-4" /> Receipt</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Widget title="Bill To">
          <div className="px-6 py-5 text-sm">
            <p className="text-white">{o.payer?.name || o.client}</p>
            <p className="mt-1 text-zinc-500">{o.payer?.email}</p>
            <p className="mt-1 text-zinc-500">{o.payer?.address}</p>
            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-600">Payment Method</p>
            <p className="text-zinc-300">{o.method}</p>
          </div>
        </Widget>
        <Widget title="Amount">
          <div className="divide-y divide-white/[0.05]">
            <Row label="Subtotal" value={fmtMoney(b.subtotal, o.currency)} />
            {b.promo && <Row label={`Promo (${b.promo})`} value={`− ${fmtMoney(b.discount, o.currency)}`} accent="text-[#00FF66]" />}
            {!b.promo && b.discount > 0 && <Row label="Discount" value={`− ${fmtMoney(b.discount, o.currency)}`} accent="text-[#00FF66]" />}
            <Row label="Tax" value={fmtMoney(b.tax, o.currency)} />
            <div className="flex items-center justify-between px-6 py-4"><span className="font-display text-sm uppercase tracking-widest text-zinc-400">Total</span><span className="font-display text-2xl font-light text-white">{fmtMoney(b.total, o.currency)}</span></div>
          </div>
        </Widget>
      </div>

      <div className="mt-6">
        <Widget testid="order-history" title="Payment History">
          <div className="px-6 py-5">
            {o.history.map((h, i) => (
              <div key={i} className="flex items-center gap-4 pb-5 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0066FF]" />
                  {i < o.history.length - 1 && <span className="mt-1 h-8 w-px bg-white/10" />}
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <StatusBadge status={h.status} />
                  <span className="text-xs text-zinc-500">{fmtDate(h.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </Widget>
      </div>
    </div>
  );
}
