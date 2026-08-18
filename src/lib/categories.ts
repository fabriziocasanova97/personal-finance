export const EXPENSE_CATEGORIES = [
  "Groceries",
  "Dining Out",
  "Coffee/Snacks",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Health",
  "Personal Care",
  "Dominion energy",
  "Washington gas",
  "Other"
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_HINTS_ES: Record<ExpenseCategory, string> = {
  "Groceries": "supermercado, mercado, despensa, comida para la casa",
  "Dining Out": "restaurante, comer fuera, cena, almuerzo afuera",
  "Coffee/Snacks": "café, snacks, antojos, merienda",
  "Transportation": "transporte, taxi, uber, gasolina, metro, bus",
  "Shopping": "compras, ropa, tiendas",
  "Entertainment": "entretenimiento, cine, salidas, diversión",
  "Health": "salud, médico, farmacia, medicinas",
  "Personal Care": "cuidado personal, peluquería, barbería, gimnasio",
  "Dominion energy": "luz, electricidad, cuenta de la luz",
  "Washington gas": "gas, cuenta del gas",
  "Other": "otro, varios, misceláneo",
};
