import { useI18n } from '@/lib/i18n';

const dictionaries = {
  pt: {
    variants: 'Tamanhos e cores', size: 'Tamanho', color: 'Cor', stock: 'Estoque', add: 'Adicionar variação', remove: 'Remover variação',
    threshold: 'Avisar quando restarem', units: 'unidades', total: 'Estoque total', invalid: 'Verifique as variações: informe tamanho ou cor, estoque inteiro e nenhuma combinação repetida.',
    choose: 'Selecione a variação', unavailable: 'Esgotado', low: 'Estoque baixo', restock: 'Repor estoque', remaining: 'Restam {{n}}',
    sale: 'Registrar venda', quantity: 'Quantidade', confirm: 'Confirmar venda', cancel: 'Cancelar', saleSuccess: 'Venda registrada e estoque atualizado.',
    saleError: 'Não foi possível registrar. Confira o estoque e tente novamente.', saleInvalid: 'Selecione uma variação disponível e uma quantidade dentro do estoque.',
    alert: 'Itens para repor', thresholdInvalid: 'Informe um limite de estoque inteiro e não negativo.', selling: 'Registrando…',
  },
  en: {
    variants: 'Sizes and colors', size: 'Size', color: 'Color', stock: 'Stock', add: 'Add variant', remove: 'Remove variant',
    threshold: 'Notify when remaining', units: 'units', total: 'Total stock', invalid: 'Check variants: enter a size or color, whole-number stock, and no duplicate combinations.',
    choose: 'Select a variant', unavailable: 'Sold out', low: 'Low stock', restock: 'Restock', remaining: '{{n}} left',
    sale: 'Record sale', quantity: 'Quantity', confirm: 'Confirm sale', cancel: 'Cancel', saleSuccess: 'Sale recorded and stock updated.',
    saleError: 'Could not record the sale. Check stock and try again.', saleInvalid: 'Select an available variant and a quantity within stock.',
    alert: 'Items to restock', thresholdInvalid: 'Enter a nonnegative whole-number stock threshold.', selling: 'Recording…',
  },
  es: {
    variants: 'Tallas y colores', size: 'Talla', color: 'Color', stock: 'Existencias', add: 'Añadir variante', remove: 'Eliminar variante',
    threshold: 'Avisar cuando queden', units: 'unidades', total: 'Existencias totales', invalid: 'Revisa las variantes: indica talla o color, existencias enteras y sin combinaciones repetidas.',
    choose: 'Selecciona una variante', unavailable: 'Agotado', low: 'Pocas existencias', restock: 'Reponer', remaining: 'Quedan {{n}}',
    sale: 'Registrar venta', quantity: 'Cantidad', confirm: 'Confirmar venta', cancel: 'Cancelar', saleSuccess: 'Venta registrada y existencias actualizadas.',
    saleError: 'No se pudo registrar. Revisa las existencias e inténtalo de nuevo.', saleInvalid: 'Selecciona una variante disponible y una cantidad dentro de las existencias.',
    alert: 'Artículos para reponer', thresholdInvalid: 'Indica un límite entero y no negativo.', selling: 'Registrando…',
  },
  fr: {
    variants: 'Tailles et couleurs', size: 'Taille', color: 'Couleur', stock: 'Stock', add: 'Ajouter une variante', remove: 'Supprimer la variante',
    threshold: 'Alerter quand il reste', units: 'unités', total: 'Stock total', invalid: 'Vérifiez les variantes : taille ou couleur, stock entier et aucune combinaison en double.',
    choose: 'Choisissez une variante', unavailable: 'Épuisé', low: 'Stock faible', restock: 'Réapprovisionner', remaining: 'Il reste {{n}}',
    sale: 'Enregistrer la vente', quantity: 'Quantité', confirm: 'Confirmer la vente', cancel: 'Annuler', saleSuccess: 'Vente enregistrée et stock mis à jour.',
    saleError: 'Impossible d’enregistrer. Vérifiez le stock et réessayez.', saleInvalid: 'Choisissez une variante disponible et une quantité dans la limite du stock.',
    alert: 'Articles à réapprovisionner', thresholdInvalid: 'Saisissez un seuil entier et positif ou nul.', selling: 'Enregistrement…',
  },
};

export function useInventoryT() {
  const { lang } = useI18n();
  return (key: keyof typeof dictionaries.pt, vars?: Record<string, string | number>) =>
    dictionaries[lang][key].replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars?.[k] ?? ''));
}