"use client";

import { useStore, FixedCost } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { FilterChip } from "@/components/ui/FilterChip";
import { Button } from "@/components/ui/Button";
import { ListRow } from "@/components/ui/ListRow";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { FixedCostModal } from "@/components/features/fixed-costs/FixedCostModal";
import { format, addMonths } from "date-fns";
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

  const ListHeader = ({ type }: { type: 'fixed' | 'debt' }) => (
    <div className="hidden md:flex items-center justify-between gap-3 py-3 px-4 bg-gray-50 border-b border-gray-200 text-xs font-mono uppercase tracking-wider text-gray-500">
      <span>{type === 'fixed' ? 'Name · Category' : 'Name · Category · Term'}</span>
      <span>Amount</span>
    </div>
  );

  const CategoryChip = ({ category }: { category: string }) => (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
      {category}
    </span>
  );

  const renderRow = (item: FixedCost) => (
    <ListRow
      key={item.id}
      onClick={() => openModal(item.type, item)}
      title={item.name}
      meta={
        item.type === 'fixed' ? (
          <CategoryChip category={item.category} />
        ) : (
          <>
            <CategoryChip category={item.category} />
            {item.monthsLeft ? (
              <>
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono tabular-nums bg-amber-50 text-amber-600">
                  {item.monthsLeft} {item.monthsLeft === 1 ? 'month' : 'months'} left
                </span>
                <span className="text-xs text-gray-500">
                  Ends {format(addMonths(new Date(), item.monthsLeft), 'MMM yyyy')}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-500">No end date</span>
            )}
          </>
        )
      }
      trailing={formatCurrency(item.amount)}
    />
  );

  const Subtotal = ({ value }: { value: number }) => (
    <div className="bg-gray-50/50 py-3 px-4 border-t border-gray-200 flex justify-between sm:justify-end items-center gap-4 sm:gap-8">
      <span className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">Subtotal</span>
      <span className="text-lg font-mono tabular-nums font-bold text-gray-900">{formatCurrency(value)}</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full min-w-0 space-y-6 sm:space-y-8">
      
      {/* Fixed Costs Section */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 min-w-0">Fixed Costs</h1>
          <Button onClick={() => openModal('fixed')} className="shrink-0">
            <Plus className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Add Fixed Cost</span><span className="sm:hidden">Add</span>
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
          <ListHeader type="fixed" />
          {filteredFixed.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredFixed.map(renderRow)}
            </div>
          ) : (
             <div className="py-8 text-center text-sm text-gray-500">No fixed costs found in this category.</div>
          )}
          <Subtotal value={fixedSubtotal} />
        </Card>
      </section>

      {/* Debts Section */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-heading font-semibold text-gray-900 min-w-0">Debts</h2>
          <Button onClick={() => openModal('debt')} className="shrink-0">
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
          <ListHeader type="debt" />
          {filteredDebts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredDebts.map(renderRow)}
            </div>
          ) : (
             <div className="py-8 text-center text-sm text-gray-500">No debts found in this category.</div>
          )}
          <Subtotal value={debtSubtotal} />
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
