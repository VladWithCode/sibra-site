export function FormatMoney(amount: number) {
    return amount.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function FormatMetric(amount: number) {
    return amount.toLocaleString("es-MX", {
        style: "unit",
        unit: "meter",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
