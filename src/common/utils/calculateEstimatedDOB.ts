export function calculateEstimatedDOB(
    purchaseDate: Date | string,
    estimatedYears: number = 0,
    estimatedMonths: number = 0,
    estimatedDays: number = 0,
): Date {
    const purchase = new Date(purchaseDate);
    const estimatedDOB = new Date(purchase);

    estimatedDOB.setFullYear(estimatedDOB.getFullYear() - estimatedYears);
    estimatedDOB.setMonth(estimatedDOB.getMonth() - estimatedMonths);
    estimatedDOB.setDate(estimatedDOB.getDate() - estimatedDays);

    return estimatedDOB;
}