"use client";

import { useStore, Income } from "@/lib/store";
import { dbUpsertIncome } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Check, X } from "lucide-react";
import { reportSyncError } from "@/lib/toast";

export function WeeklyIncomeEditor() {
  const { income, setIncome } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  // Fix hydration mismatch by only rendering after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const handleSave = () => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0) {
      const newIncome: Income = {
        id: income?.id || crypto.randomUUID(),
        user_id: "temp-user", // to be replaced by auth.uid() later
        weekly_amount: val,
        updated_at: new Date().toISOString()
      };
      setIncome(newIncome);
      // Background cloud sync
      dbUpsertIncome(newIncome).catch(reportSyncError('income'));
    }
    setIsEditing(false);
  };

  const currentWeekly = income?.weekly_amount || 0;
  const currentMonthly = currentWeekly * 4.33; // approx weeks in month
  const currentAnnual = currentWeekly * 52;

  return (
    <Card className="bg-accent/5 border-accent/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-heading font-semibold text-lg text-gray-900">Your Income</h3>
            <p className="text-sm text-gray-500">Base weekly income for tracking</p>
          </div>
          {!isEditing ? (
            <Button variant="ghost" size="icon" onClick={() => {
              setEditValue(currentWeekly.toString());
              setIsEditing(true);
            }}>
              <Pencil className="h-4 w-4 text-accent" />
            </Button>
          ) : (
             <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" onClick={handleSave} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                 <Check className="h-4 w-4" />
               </Button>
               <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                 <X className="h-4 w-4" />
               </Button>
             </div>
          )}
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full p-4 bg-white rounded-sm shadow-sm border border-gray-100">
            <Label className="text-xs text-gray-400 uppercase tracking-wider">Weekly</Label>
            {isEditing ? (
              <Input 
                autoFocus
                type="number" 
                value={editValue} 
                onChange={e => setEditValue(e.target.value)}
                className="mt-1 font-mono text-xl text-gray-900 font-semibold h-10"
              />
            ) : (
              <div className="mt-1 font-mono text-2xl text-gray-900 font-semibold">
                {formatCurrency(currentWeekly)}
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full p-4 bg-white rounded-sm shadow-sm border border-gray-100 opacity-80 cursor-default">
            <Label className="text-xs text-gray-400 uppercase tracking-wider">Monthly (Est.)</Label>
            <div className="mt-1 font-mono text-lg text-gray-700 font-medium">
              {formatCurrency(currentMonthly)}
            </div>
          </div>
          
          <div className="flex-1 w-full p-4 bg-white rounded-sm shadow-sm border border-gray-100 opacity-80 cursor-default">
            <Label className="text-xs text-gray-400 uppercase tracking-wider">Annual (Est.)</Label>
            <div className="mt-1 font-mono text-lg text-gray-700 font-medium">
              {formatCurrency(currentAnnual)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
