"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/FilterChip";
import { Card } from "@/components/ui/Card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { addExpense } from "@/lib/expenses";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

type Status = "idle" | "loading";

interface PendingExpense {
  amount: number;
  description: string;
  date: string;
}

interface ParseExpenseSuccess {
  amount: number;
  description: string;
  category: string | null;
  date: string;
}

interface ParseExpenseError {
  error: string;
}

export function QuickExpenseInput() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingExpense | null>(null);

  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const registerExpense = (input: {
    amount: number;
    description: string;
    category: string;
    date: string;
  }) => {
    addExpense(input);
    const formattedDate = format(new Date(`${input.date}T00:00:00`), "d MMM");
    showSuccess(
      `Registrado: ${input.description} — $${input.amount.toFixed(2)} — ${input.category} — ${formattedDate}`
    );
    setText("");
    setPending(null);
    setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || status === "loading") return;

    setErrorMessage(null);
    setStatus("loading");

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const res = await fetch("/api/parse-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, today }),
      });

      if (!res.ok) {
        let message = "No se pudo procesar. Intenta de nuevo.";
        try {
          const data: ParseExpenseError = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // keep default message
        }
        setErrorMessage(message);
        setStatus("idle");
        return;
      }

      const data: ParseExpenseSuccess = await res.json();

      if (data.category !== null) {
        registerExpense({
          amount: data.amount,
          description: data.description,
          category: data.category,
          date: data.date,
        });
      } else {
        setPending({
          amount: data.amount,
          description: data.description,
          date: data.date,
        });
        setStatus("idle");
      }
    } catch {
      setErrorMessage("No se pudo procesar. Intenta de nuevo.");
      setStatus("idle");
    }
  };

  const handleChooseCategory = (category: string) => {
    if (!pending) return;
    registerExpense({ ...pending, category });
  };

  const handleCancelPending = () => {
    setPending(null);
  };

  return (
    <Card className="p-4 space-y-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='p.ej. café 5 dólares categoría "entretenimiento"'
          disabled={status === "loading" || !!pending}
          className="flex-1"
        />
        <Button type="submit" disabled={status === "loading" || !!pending}>
          {status === "loading" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registrando...
            </>
          ) : (
            "Registrar"
          )}
        </Button>
      </form>

      {pending && (
        <div className="space-y-2 pt-1">
          <p className="text-sm text-gray-700">
            ¿En qué categoría va{" "}
            <strong>
              {pending.description} — ${pending.amount.toFixed(2)}
            </strong>
            ?
          </p>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((category) => (
              <FilterChip
                key={category}
                onClick={() => handleChooseCategory(category)}
                className="text-xs"
              >
                {category}
              </FilterChip>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={handleCancelPending}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}

      {successMessage && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          {successMessage}
        </p>
      )}
    </Card>
  );
}
