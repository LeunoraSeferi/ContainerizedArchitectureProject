export function productLinks(productId, categoryId) {
  return {
    self: { href: `/api/v1/products/${productId}` },
    update: { href: `/api/v1/products/${productId}` },
    delete: { href: `/api/v1/products/${productId}` },
    category: { href: `/api/v1/categories/${categoryId}` }
  };
}

