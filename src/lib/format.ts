export function formatPrice(cents: number, unit?: string | null) {
  const dollars = (cents / 100).toFixed(2);
  return unit && unit !== "each" ? `$${dollars}/${unit.replace("per ", "")}` : `$${dollars}`;
}

export function stockLabel(status: string, count: number) {
  switch (status) {
    case "in_stock":
      return count > 0 ? `${count} In Stock` : "In Stock";
    case "low_stock":
      return `Only ${count} Left`;
    case "special_order":
      return "Special Order Only";
    case "out_of_stock":
      return "Out of Stock";
    default:
      return "Available";
  }
}

export function stockTone(status: string): "success" | "brand" | "muted" {
  if (status === "special_order") return "brand";
  if (status === "out_of_stock") return "muted";
  return "success";
}
