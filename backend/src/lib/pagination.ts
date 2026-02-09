export function parsePagination(query: { page?: string; per_page?: string; limit?: string; offset?: string }) {
  const page = Math.max(1, Number(query.page || '1'));
  const perPage = Math.min(100, Math.max(1, Number(query.per_page || query.limit || '20')));
  const offset = query.offset !== undefined ? Number(query.offset) : (page - 1) * perPage;

  return { page, perPage, offset };
}

export function buildMeta(page: number, perPage: number, total: number) {
  return {
    current_page: page,
    per_page: perPage,
    total,
    total_pages: Math.ceil(total / perPage),
  };
}
