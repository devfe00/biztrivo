export interface Groupable {
  id: string;
  saleGroupId?: string;
}

export interface SaleGroup<T> {
  key: string;
  items: T[];
}

/** Agrupa itens com o mesmo saleGroupId na posição da primeira ocorrência; itens sem grupo ficam sozinhos. */
export function groupBySale<T extends Groupable>(items: T[]): SaleGroup<T>[] {
  const groups: SaleGroup<T>[] = [];
  const positions = new Map<string, number>();
  for (const item of items) {
    if (!item.saleGroupId) {
      groups.push({ key: item.id, items: [item] });
      continue;
    }
    const position = positions.get(item.saleGroupId);
    if (position === undefined) {
      positions.set(item.saleGroupId, groups.length);
      groups.push({ key: item.saleGroupId, items: [item] });
    } else {
      groups[position].items.push(item);
    }
  }
  return groups;
}