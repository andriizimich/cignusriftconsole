import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Building, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { fmtMoney } from "@/components/OrdersTable";

const PROMOS = { COHORT12: 1200, EDU5: 600, VR10: 500 };

export default function Checkout() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [client, setClient] = useState("");
  const [method, setMethod] = useState("Card");
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(0);

  useEffect(() => { api.get("/meta").then((r) => { setProducts(r.data.products); setProductId(r.data.products[0]?.id || ""); }); }, []);
  const product = products.find((p) => p.id === productId);
  const subtotal = product?.price || 0;
  const total = subtotal - applied;

  const applyPromo = () => {
    const d = PROMOS[promo.toUpperCase()];
    if (d) { setApplied(d); toast.success(`Promo applied: −${fmtMoney(d)}`); }
    else { setApplied(0); toast.error("Invalid promo code"); }
  };

  const pay = async () => {
    if (!client || !product) { toast.error("Enter client and select a product"); return; }
    const r = await api.post("/orders", { client, product: product.name, amount: subtotal, method, promo: applied ? promo.toUpperCase() : null, discount: applied });
    toast.success("Payment successful (stub)");
    navigate(`/dashboard/orders/${r.data.id}`);
  };

  const inp = "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50";
  const lbl = "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500";

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate("/dashboard/orders")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Orders</button>
      <h1 className="mb-8 font-display text-3xl font-light tracking-tighter sm:text-4xl">Checkout</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Payment zone */}
        <div className="space-y-5 rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6 lg:col-span-3">
          <div><label className={lbl}>Client / Organization</label><input data-testid="checkout-client-input" className={inp} value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Global Fund Institute" /></div>
          <div><label className={lbl}>Product</label><select data-testid="checkout-product-select" className={inp} value={productId} onChange={(e) => setProductId(e.target.value)}>{products.map((p) => <option key={p.id} value={p.id}>{p.name} — {fmtMoney(p.price)}</option>)}</select></div>
          <div>
            <label className={lbl}>Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              {[["Card", CreditCard], ["Wire Transfer", Building]].map(([m, Icon]) => (
                <button key={m} data-testid={`method-${m}`} onClick={() => setMethod(m)} className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm transition-colors ${method === m ? "border-[#0066FF] bg-[#0066FF]/10 text-white" : "border-white/10 text-zinc-400 hover:text-white"}`}><Icon className="h-4 w-4" /> {m}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Promo Code</label>
            <div className="flex gap-2">
              <div className="relative flex-1"><Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="checkout-promo-input" className={`${inp} pl-9`} value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="COHORT12" /></div>
              <button data-testid="apply-promo-btn" onClick={applyPromo} className="rounded-md border border-white/15 px-4 text-sm text-zinc-300 hover:text-white">Apply</button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-medium tracking-tight">Summary</h2>
          <div className="mt-5 rounded-md border border-white/10 bg-black/30 p-4">
            <p className="text-sm text-white">{product?.name || "—"}</p>
            <p className="mt-1 text-xs text-zinc-500">{method}</p>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>{fmtMoney(subtotal)}</span></div>
            {applied > 0 && <div className="flex justify-between text-[#00FF66]"><span>Discount</span><span>− {fmtMoney(applied)}</span></div>}
            <div className="flex justify-between text-zinc-400"><span>Tax</span><span>{fmtMoney(0)}</span></div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4"><span className="text-[10px] uppercase tracking-widest text-zinc-500">Total</span><span data-testid="checkout-total" className="font-display text-2xl font-light text-white">{fmtMoney(total)}</span></div>
          <button data-testid="pay-btn" onClick={pay} className="mt-6 w-full rounded-md bg-[#0066FF] py-3 font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90">Pay {fmtMoney(total)}</button>
        </div>
      </div>
    </div>
  );
}
