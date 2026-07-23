import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Widget } from "@/components/Widget";
import { OrdersTable, fmtMoney } from "@/components/OrdersTable";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  useEffect(() => { api.get("/orders").then((r) => setOrders(r.data)); }, []);

  const paid = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.amount, 0);
  const pending = orders.filter((o) => o.status === "pending").reduce((s, o) => s + o.amount, 0);

  return (
    <div>
      <PageHeader overline="Billing" title="Orders" subtitle="Latest enterprise orders with payment status and receipts."
        action={<button data-testid="new-order-btn" onClick={() => navigate("/dashboard/orders/new")} className="inline-flex items-center gap-2 rounded-md bg-[#0066FF] px-4 py-2.5 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90"><Plus className="h-4 w-4" /> New Order</button>} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6" data-testid="orders-total-collected">
          <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Collected</p>
          <p className="mt-3 font-display text-3xl font-light text-[#00FF66]">{fmtMoney(paid)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6" data-testid="orders-total-pending">
          <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Pending</p>
          <p className="mt-3 font-display text-3xl font-light text-[#FFB800]">{fmtMoney(pending)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6" data-testid="orders-count">
          <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Total Orders</p>
          <p className="mt-3 font-display text-3xl font-light text-white">{orders.length}</p>
        </div>
      </div>
      <Widget testid="orders-full-widget" title="All Orders">
        <OrdersTable orders={orders} />
      </Widget>
    </div>
  );
}
