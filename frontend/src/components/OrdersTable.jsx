import { Download } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";

export const fmtMoney = (amount, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

export const OrdersTable = ({ orders }) => {
  const navigate = useNavigate();
  const downloadReceipt = (id) => {
    toast.info("Receipt generation coming soon", { description: `Order ${id} receipt is queued.` });
  };

  return (
    <div className="overflow-x-auto" data-testid="orders-table">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <th className="border-b border-white/[0.06] px-6 py-3 font-medium">Order ID</th>
            <th className="border-b border-white/[0.06] px-6 py-3 font-medium">Date</th>
            <th className="border-b border-white/[0.06] px-6 py-3 font-medium">Client</th>
            <th className="border-b border-white/[0.06] px-6 py-3 font-medium">Product</th>
            <th className="border-b border-white/[0.06] px-6 py-3 font-medium">Amount</th>
            <th className="border-b border-white/[0.06] px-6 py-3 font-medium">Payment</th>
            <th className="border-b border-white/[0.06] px-6 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} data-testid={`order-row-${o.id}`} onClick={() => navigate(`/dashboard/orders/${o.id}`)} className="cursor-pointer transition-colors hover:bg-white/[0.03]">
              <td className="border-b border-white/[0.05] px-6 py-4 font-mono-plex text-[#0066FF]">{o.id}</td>
              <td className="border-b border-white/[0.05] px-6 py-4 text-zinc-400">{fmtDate(o.date)}</td>
              <td className="border-b border-white/[0.05] px-6 py-4 text-white">{o.client}</td>
              <td className="border-b border-white/[0.05] px-6 py-4 text-zinc-400">{o.product}</td>
              <td className="border-b border-white/[0.05] px-6 py-4 font-mono-plex text-white">{fmtMoney(o.amount, o.currency)}</td>
              <td className="border-b border-white/[0.05] px-6 py-4"><StatusBadge status={o.status} /></td>
              <td className="border-b border-white/[0.05] px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                <button
                  data-testid={`download-receipt-${o.id}`}
                  onClick={() => downloadReceipt(o.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-[#0066FF]/50 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" /> Receipt
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
