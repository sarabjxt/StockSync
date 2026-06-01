export const DB_CONSTRAINTS = {
  product: {
    userSkuUniq: "product_user_sku_idx",
  },
  category: {
    userNameUniq: "category_user_name_idx",
  },
} as const
