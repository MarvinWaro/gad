/** The CHED office running this PHLGADIS site, from config/phlgadis.php. */
export type SiteOperator = {
    /** Such as "CHED Regional Office XII". */
    name: string;
    /** Such as "CHEDRO XII", for the footer. */
    short_name: string;
    hotline: string;
    email: string;
};
