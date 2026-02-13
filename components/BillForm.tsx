
import React, { useState } from 'react';
import { Bill, BillItem, BillStatus, SUPPORTED_CURRENCIES } from '../types';

interface BillFormProps {
  initialData?: Partial<Bill>;
  onSubmit: (bill: Bill) => void;
  onCancel: () => void;
  preferredCurrency: string;
}

export const BillForm: React.FC<BillFormProps> = ({ initialData, onSubmit, onCancel, preferredCurrency }) => {
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [status, setStatus] = useState<BillStatus>(initialData?.status || 'UNPAID');
  const [currency, setCurrency] = useState(initialData?.currency || preferredCurrency);
  const [items, setItems] = useState<BillItem[]>(initialData?.items || [{ description: '', quantity: 1, rate: 0, amount: 0 }]);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = items.reduce((s, i) => s + i.amount, 0);

  const addItem = () => setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  
  const splitItem = (index: number) => {
    const item = items[index];
    const halfRate = item.rate / 2;
    const next = [...items];
    next[index] = { ...item, rate: halfRate, amount: item.quantity * halfRate };
    next.splice(index + 1, 0, { ...item, description: `${item.description} (Part 2)`, rate: halfRate, amount: item.quantity * halfRate });
    setItems(next);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim()) newErrors.customerName = "Required";
    if (items.some(i => i.rate < 0)) newErrors.items = "Rates must be positive";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        id: initialData?.id || crypto.randomUUID(),
        customerName,
        date,
        dueDate: dueDate || date,
        status,
        currency,
        items,
        totalAmount: total,
        tags,
        lastModified: new Date().toISOString()
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-10 rounded-[2.5rem] border border-slate-700 shadow-2xl space-y-8 animate-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Vendor / Customer</label>
          <input 
            value={customerName} 
            onChange={e => setCustomerName(e.target.value)}
            className="w-full bg-slate-900 rounded-2xl p-4 text-sm font-bold border-none outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Currency</label>
          <select 
            value={currency} 
            onChange={e => setCurrency(e.target.value)}
            className="w-full bg-slate-900 rounded-2xl p-4 text-sm font-bold border-none outline-none"
          >
            {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Line Items</h4>
          <button type="button" onClick={addItem} className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg">Add Row</button>
        </div>
        {items.map((it, idx) => (
          <div key={idx} className="flex flex-wrap gap-4 items-center bg-slate-900 p-4 rounded-2xl border border-slate-700 group">
            <input 
              className="flex-1 min-w-[150px] bg-transparent outline-none text-xs font-bold" 
              placeholder="Description"
              value={it.description}
              onChange={e => {
                const n = [...items];
                n[idx].description = e.target.value;
                setItems(n);
              }}
            />
            <input 
              type="number" 
              className="w-16 bg-transparent outline-none text-xs font-bold text-center" 
              value={it.quantity}
              onChange={e => {
                const n = [...items];
                n[idx].quantity = +e.target.value;
                n[idx].amount = n[idx].quantity * n[idx].rate;
                setItems(n);
              }}
            />
            <input 
              type="number" 
              className="w-24 bg-transparent outline-none text-xs font-bold text-right" 
              value={it.rate}
              onChange={e => {
                const n = [...items];
                n[idx].rate = +e.target.value;
                n[idx].amount = n[idx].quantity * n[idx].rate;
                setItems(n);
              }}
            />
            <div className="w-24 text-right text-xs font-black text-indigo-400">{it.amount.toFixed(2)}</div>
            <button type="button" onClick={() => splitItem(idx)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-indigo-400" title="Split">✂️</button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-slate-700">
        <div className="text-3xl font-black text-indigo-400">{total.toFixed(2)} {currency}</div>
        <div className="flex gap-4">
          <button type="button" onClick={onCancel} className="px-8 py-3 bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-600">Cancel</button>
          <button type="submit" className="px-8 py-3 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20">Save Ledger</button>
        </div>
      </div>
    </form>
  );
};
