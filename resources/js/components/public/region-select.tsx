import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { DirectoryOption } from '@/types/monitoring';

/** The Select's value for every region; Radix reserves the empty string. */
const ALL_REGIONS = 'all';

/**
 * The public site's Region filter: "All regions", then each region a
 * visitor can pick, labelled as the homepage's other filters are
 * (`.year-control`). Null is every region.
 */
export function RegionSelect({
    id,
    regions,
    value,
    onChange,
}: {
    id: string;
    regions: DirectoryOption[];
    value: number | null;
    onChange: (region: number | null) => void;
}) {
    return (
        <div className="year-control">
            <label htmlFor={id}>Region</label>
            <Select
                value={value === null ? ALL_REGIONS : String(value)}
                onValueChange={(next) =>
                    onChange(next === ALL_REGIONS ? null : Number(next))
                }
            >
                <SelectTrigger id={id} aria-label="Region">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="public-theme">
                    <SelectItem value={ALL_REGIONS}>All regions</SelectItem>
                    {regions.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                            {option.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
