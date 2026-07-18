export const company = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || "StockPilot",
  logo: process.env.NEXT_PUBLIC_COMPANY_LOGO || "/logo.png",

  colors: {
    primary: process.env.NEXT_PUBLIC_COLOR_PRIMARY || "#3b82f6",
    background: process.env.NEXT_PUBLIC_COLOR_BACKGROUND || "#18181b",
    card: process.env.NEXT_PUBLIC_COLOR_CARD || "#27272a",
    text: process.env.NEXT_PUBLIC_COLOR_TEXT || "#f4f4f5",
    muted: process.env.NEXT_PUBLIC_COLOR_MUTED || "#a1a1aa",
    border: process.env.NEXT_PUBLIC_COLOR_BORDER || "#3f3f46",
  },

  features: {
    reports: process.env.NEXT_PUBLIC_FEATURE_REPORTS !== "false",
    customers: process.env.NEXT_PUBLIC_FEATURE_CUSTOMERS !== "false",
    ingredients: process.env.NEXT_PUBLIC_FEATURE_INGREDIENTS !== "false",
  },
};