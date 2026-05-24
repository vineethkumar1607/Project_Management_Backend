export const parseDate = (date) => {
    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
        throw createError(400, "Invalid date format");
    }

    return parsed;
};
