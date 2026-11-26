export function validJobBudget(min?: number | null, max?: number | null): boolean {
  if (min == null && max == null) return true;
  return min != null && max != null && Number.isFinite(min) && Number.isFinite(max)
    && min >= 0.01 && max >= min && max <= 99999999.99;
}
export function readJobBudget(min: string, max: string): {budgetMin:number|null;budgetMax:number|null} | null {
  const a = min.trim() ? Number(min) : null, b = max.trim() ? Number(max) : null;
  return validJobBudget(a,b) ? {budgetMin:a,budgetMax:b} : null;
}
export function formatJobBudget(min: string|number|null|undefined, max: string|number|null|undefined): string {
  if (min == null || max == null || !validJobBudget(Number(min),Number(max))) return "Open to quotes";
  const money = (n:number) => new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",maximumFractionDigits:2}).format(n);
  return Number(min) === Number(max) ? money(Number(min)) : money(Number(min))+"–"+money(Number(max));
}
