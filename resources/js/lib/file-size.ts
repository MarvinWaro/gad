// "6.7 MB", "358 kB": decimal units, as file managers and browsers show them.
export function formatFileSize(bytes: number) {
    const [unit, size, digits] =
        bytes >= 1e6
            ? (['megabyte', 1e6, 1] as const)
            : bytes >= 1e3
              ? (['kilobyte', 1e3, 0] as const)
              : (['byte', 1, 0] as const);

    return new Intl.NumberFormat('en-US', {
        style: 'unit',
        unit,
        unitDisplay: 'short',
        maximumFractionDigits: digits,
    }).format(bytes / size);
}
