const API = "http://localhost:3000";

export interface Recipe {
  id?: number;
  name: string;

  curingTemp: number;
  tempBandPlus: number;
  tempBandMinus: number;

  pressure: number;
  pressureBandPlus: number;
  pressureBandMinus: number;

  curingTime: number;
  exhaustDelay: number;
  purgingCycles: number;

  high1: number;
  low1: number;
  high2: number;
  low2: number;
  high3: number;
  low3: number;
  high4: number;
  low4: number;
  high5: number;
  low5: number;

  scheduledAt?: string | null;
  status?: string;
  createdAt?: string;
}

export interface ChangeLog {
  id: number;
  timestamp: string;
  user?: string | null;
  action: string;
  details: unknown;
}

export const getRecipes = (): Promise<Recipe[]> =>
  fetch(`${API}/api/recipes`).then((r) => r.json());

export const createRecipe = (data: Recipe): Promise<Recipe> =>
  fetch(`${API}/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const updateRecipe = (
  id: number,
  data: Partial<Recipe>
): Promise<Recipe> =>
  fetch(`${API}/api/recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const deleteRecipe = (id: number): Promise<{ status: string }> =>
  fetch(`${API}/api/recipes/${id}`, { method: "DELETE" }).then((r) => r.json());

export const getLogs = (): Promise<ChangeLog[]> =>
  fetch(`${API}/api/logs`).then((r) => r.json());
