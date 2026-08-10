export function calculateAge(dateOfBirth: Date | string | null) {
    if (!dateOfBirth) return null;

    const dob = new Date(dateOfBirth);
    const today = new Date();

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
        months--;

        const previousMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            0
        );

        days += previousMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    return {
        years,
        months,
        days,
        totalMonths: years * 12 + months,
        display:
            years > 0
                ? `${years} Year${years > 1 ? 's' : ''} ${months} Month${months !== 1 ? 's' : ''}`
                : months > 0
                    ? `${months} Month${months !== 1 ? 's' : ''}`
                    : `${days} Day${days !== 1 ? 's' : ''}`,
    };
}