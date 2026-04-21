export const parseDate = (date) => {
    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
        throw createError("Invalid date format", 400);
    }

    return parsed;
};