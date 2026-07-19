export const company = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || "StockPilot",
  logo: process.env.NEXT_PUBLIC_COMPANY_LOGO || "/logo.png",

  colors: {
  primary: process.env.NEXT_PUBLIC_COLOR_PRIMARY,
  background: process.env.NEXT_PUBLIC_COLOR_BACKGROUND,
  card: process.env.NEXT_PUBLIC_COLOR_CARD,
  text: process.env.NEXT_PUBLIC_COLOR_TEXT,
  muted: process.env.NEXT_PUBLIC_COLOR_MUTED,
  border: process.env.NEXT_PUBLIC_COLOR_BORDER,
},


  features: {
    reports: process.env.NEXT_PUBLIC_FEATURE_REPORTS !== "false",
    customers: process.env.NEXT_PUBLIC_FEATURE_CUSTOMERS !== "false",
    ingredients: process.env.NEXT_PUBLIC_FEATURE_INGREDIENTS !== "false",
  },
};