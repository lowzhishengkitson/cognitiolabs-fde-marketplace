export const formatPrice = (price: number) => new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 }).format(price);
export const formatStorage = (gb: number) => gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`;
