"use client";

import { useStore, FixedCost } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FilterChip } from "@/components/ui/FilterChip";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { FixedCostModal } from "@/components/features/fixed-costs/FixedCostModal";
import { format, parseISO, addMonths } from "date-fns";
import { Plus } from "lucide-react";

export default function FixedCostsPage() {
  const { fixedCosts } = useStore();
  const [mounted, setMounted] = useState(false);
  
  // Local states
  const [activeFixedCategory, setActiveFixedCategory] = useState<string>("All");
  const [activeDebtCategory, setActiveDebtCategory] = useState<string>("All");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [costToEdit, setCostToEdit] = useState<FixedCost | null>(null);
  const [modalType, setModalType] = useState<'fixed' | 'debt'>('fixed');

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Split data
  const fixedItems = fixedCosts.filter(c => c.type === 'fixed');
  const debtItems = fixedCosts.filter(c => c.type === 'debt');

  // Filter categories
  const fixedCategories = ["All", ...Array.from(new Set(fixedItems.map(c => c.category)))];
  const debtCategories = ["All", ...Array.from(new Set(debtItems.map(c => c.category)))];

  // Applied filters
  const filteredFixed = activeFixedCategory === "All" ? fixedItems : fixedItems.filter(c => c.category === activeFixedCategory);
  const filteredDebts = activeDebtCategory === "All" ? debtItems : debtItems.filter(c => c.category === activeDebtCategory);

  // Subtotals
  const fixedSubtotal = filteredFixed.reduce((acc, curr) => acc + curr.amount, 0);
  const debtSubtotal = filteredDebts.reduce((acc, curr) => acc + curr.amount, 0);

  const openModal = (type: 'fixed' | 'debt', cost?: FixedCost) => {
    setModalType(type);
    setCostToEdit(cost || null);
    setIsModalOpen(true);
  };

  const TableHeader = ({ type }: { type: 'fixed' | 'debt' }) => (
    <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-gray-50 border-y border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
      <div className={type === 'fixed' ? "col-span-5" : "col-span-3"}>Name</div>
      <div className={type === 'fixed' ? "col-span-4" : "col-span-3"}>Category</div>
      <div className={type === 'fixed' ? "col-span-3 text-right" : "col-span-2 text-right"}>Amount</div>
      {type === 'debt' && <div className="col-span-2 text-right">Months Left</div>}
      {type === 'debt' && <div className="col-span-2 text-right">End Date</div>}
    </div>
  );

  const renderRow = (item: FixedCost) => (
    <div 
      key={item.id} 
      onClick={() => openModal(item.type, item)}
      className="grid grid-cols-12 gap-4 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group items-center"
    >
      <div className={item.type === 'fixed' ? "col-span-5 font-medium text-gray-900" : "col-span-3 font-medium text-gray-900"}>{item.name}</div>
      <div className={item.type === 'fixed' ? "col-span-4" : "col-span-3"}>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          {item.category}
        </span>
      </div>
      <div className={item.type === 'fixed' ? "col-span-3 text-right font-mono font-medium text-gray-900" : "col-span-2 text-right font-mono font-medium text-gray-900"}>{formatCurrency(item.amount)}</div>
      {item.type === 'debt' && (
        <div className="col-span-2 text-right text-sm text-gray-500 font-medium">
          {item.monthsLeft ? `${item.monthsLeft} mo` : '-'}
        </div>
      )}
      {item.type === 'debt' && (
        <div className="col-span-2 text-right text-sm text-gray-500 font-medium">
          {item.monthsLeft ? format(addMonths(new Date(), item.monthsLeft), 'MMM yyyy') : '-'}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">
      
      {/* Fixed Costs Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-heading font-bold text-gray-900">Fixed Costs</h2>
          <Button onClick={() => openModal('fixed')} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Fixed Cost
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {fixedCategories.map(cat => (
            <FilterChip 
              key={cat} 
              active={activeFixedCategory === cat} 
              onClick={() => setActiveFixedCategory(cat)}
            >
              {cat}
            </FilterChip>
          ))}
        </div>

        <Card className="overflow-hidden">
          <TableHeader type="fixed" />
          {filteredFixed.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredFixed.map(renderRow)}
            </div>
          ) : (
             <div className="py-8 text-center text-sm text-gray-500">No fixed costs found in this category.</div>
          )}
          <div className="bg-gray-50/50 py-3 px-4 border-t border-gray-200 flex justify-end items-center">
             <span className="text-sm font-semibold text-gray-500 mr-8 uppercase tracking-wider">Subtotal</span>
             <span className="text-lg font-mono font-bold text-gray-900">{formatCurrency(fixedSubtotal)}</span>
          </div>
        </Card>
      </section>

      {/* Debts Section */}
      <section className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-heading font-bold text-gray-900">Debts</h2>
          <Button onClick={() => openModal('debt')} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Debt
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {debtCategories.map(cat => (
            <FilterChip 
              key={cat} 
              active={activeDebtCategory === cat} 
              onClick={() => setActiveDebtCategory(cat)}
            >
              {cat}
            </FilterChip>
          ))}
        </div>

        <Card className="overflow-hidden">
          <TableHeader type="debt" />
          {filteredDebts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredDebts.map(renderRow)}
            </div>
          ) : (
             <div className="py-8 text-center text-sm text-gray-500">No debts found in this category.</div>
          )}
          <div className="bg-gray-50/50 py-3 px-4 border-t border-gray-200 flex justify-end items-center">
             <span className="text-sm font-semibold text-gray-500 mr-8 uppercase tracking-wider">Subtotal</span>
             <span className="text-lg font-mono font-bold text-gray-900">{formatCurrency(debtSubtotal)}</span>
          </div>
        </Card>
      </section>

      <FixedCostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        costToEdit={costToEdit} 
        typeFilter={modalType} 
      />

    </div>
  );
}
