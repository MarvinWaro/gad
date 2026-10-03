import {
    BookOpen,
    FileText,
    NotebookTabs,
    Scale,
    Video,
    type LucideIcon,
} from 'lucide-react';
import type { ResourceRecord } from '@/data/phlgadis-demo';

/**
 * Each resource area's icon, for the landing page's "Learn more. Do more."
 * cards and the HEI home's Resources list.
 */
export const resourceIcons = {
    terms: BookOpen,
    acts: Scale,
    videos: Video,
    issuances: FileText,
    manuals: NotebookTabs,
} satisfies Record<ResourceRecord['id'], LucideIcon>;
