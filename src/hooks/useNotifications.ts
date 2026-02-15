import { toast } from "sonner";

export const useNotifications = () => {
  
  const checkStockAlert = (productName: string, quantity: number) => {
    if (quantity <= 3 && quantity > 0) {
      toast.warning(`Estoque baixo: ${productName}`, {
        description: `Restam apenas ${quantity} unidades no seu estoque.`,
        duration: 5000,
      });
    } else if (quantity === 0) {
      toast.error(`Produto esgotado: ${productName}`, {
        description: "Reponha seu estoque para continuar vendendo.",
        duration: 5000,
      });
    }
  };

  const notifySale = (amount: number) => {
    toast.success("💰 Venda registrada!", {
      description: `Mais ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para o seu caixa.`,
    });
  };

  const notifyPersonalExpense = () => {
    toast.info("Aviso de Gasto Pessoal", {
      description: "Lembre-se: retirar muito lucro da loja pode travar seu crescimento.",
      icon: "⚠️",
    });
  };

  return { checkStockAlert, notifySale, notifyPersonalExpense };
};