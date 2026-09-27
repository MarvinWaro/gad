// Fictional aggregate fixtures for the frontend preview. Replace with server
// props when dashboard analytics are implemented; never mix with live counts.
export const periods = {
    month: {
        label: 'September 2026',
        range: 'Sep 1–30, 2026',
        comparison: 'vs. August',
    },
    quarter: {
        label: 'Q3 2026',
        range: 'Jul 1–Sep 30, 2026',
        comparison: 'vs. Q2',
    },
    semester: {
        label: '2nd semester 2026 · Jul–Dec',
        range: 'Jul 1–Dec 31, 2026',
        comparison: 'vs. 1st semester 2026',
    },
    annual: {
        label: 'Annual 2026 · Jan–Dec',
        range: 'Jan 1–Dec 31, 2026',
        comparison: 'vs. 2025',
    },
} as const;
export type DashboardPeriod = keyof typeof periods;
export type ActivityMetric = 'responses' | 'posts';

export const periodLabels: Record<DashboardPeriod, string> = {
    month: 'Month',
    quarter: 'Quarter',
    semester: 'Semester',
    annual: 'Annual',
};
export const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export function reportingPeriod(period: DashboardPeriod, monthIndex = 8) {
    const size =
        period === 'month'
            ? 1
            : period === 'quarter'
              ? 3
              : period === 'semester'
                ? 6
                : 12;
    const start = Math.floor(monthIndex / size) * size;
    const end = start + size - 1;
    const number = start / size + 1;
    const label =
        period === 'month'
            ? `${monthNames[start]} 2026`
            : period === 'quarter'
              ? `Q${number} 2026`
              : period === 'semester'
                ? `${number === 1 ? '1st' : '2nd'} semester 2026`
                : 'Annual 2026';
    const comparison =
        start === 0 && period !== 'annual'
            ? 'No earlier sample data'
            : period === 'month'
              ? `vs. ${monthNames[start - 1]}`
              : period === 'quarter'
                ? `vs. Q${number - 1}`
                : period === 'semester'
                  ? 'vs. 1st semester 2026'
                  : 'vs. 2025';
    const lastDay = new Date(Date.UTC(2026, end + 1, 0)).getUTCDate();
    return {
        start,
        end,
        label,
        comparison,
        range: `${monthNames[start].slice(0, 3)} 1–${monthNames[end].slice(0, 3)} ${lastDay}, 2026`,
    };
}

const baseSnapshots = {
    month: {
        activity: [
            { date: 'Sep 1–5', responses: 284, posts: 12 },
            { date: 'Sep 6–10', responses: 356, posts: 18 },
            { date: 'Sep 11–15', responses: 312, posts: 16 },
            { date: 'Sep 16–20', responses: 478, posts: 24 },
            { date: 'Sep 21–25', responses: 526, posts: 26 },
            { date: 'Sep 26–30', responses: 530, posts: 30 },
        ],
        previousResponses: 2114,
        previousPosts: 98,
        clusters: [
            { name: 'South Cotabato', participating: 12, total: 14 },
            { name: 'Cotabato', participating: 10, total: 12 },
            { name: 'Sultan Kudarat', participating: 9, total: 11 },
            { name: 'Sarangani', participating: 7, total: 9 },
        ],
        likes: 486,
        comments: 154,
        shares: 44,
        contributors: 24,
    },
    quarter: {
        activity: [
            { date: 'Jul 1–15', responses: 1124, posts: 36 },
            { date: 'Jul 16–31', responses: 1200, posts: 42 },
            { date: 'Aug 1–15', responses: 1014, posts: 46 },
            { date: 'Aug 16–31', responses: 1100, posts: 52 },
            { date: 'Sep 1–15', responses: 952, posts: 46 },
            { date: 'Sep 16–30', responses: 1534, posts: 80 },
        ],
        previousResponses: 5820,
        previousPosts: 264,
        clusters: [
            { name: 'South Cotabato', participating: 14, total: 14 },
            { name: 'Cotabato', participating: 11, total: 12 },
            { name: 'Sultan Kudarat', participating: 10, total: 11 },
            { name: 'Sarangani', participating: 8, total: 9 },
        ],
        likes: 1286,
        comments: 412,
        shares: 118,
        contributors: 35,
    },
};

type ActivityPoint = { date: string; responses: number; posts: number };

function activityTotal(points: ActivityPoint[], metric: ActivityMetric) {
    return points.reduce((sum, point) => sum + point[metric], 0);
}

function monthlyPoint(date: string, points: ActivityPoint[]): ActivityPoint {
    return {
        date,
        responses: activityTotal(points, 'responses'),
        posts: activityTotal(points, 'posts'),
    };
}

// Reuse the detailed period buckets so overlapping chart totals cannot drift.
const annualActivity: ActivityPoint[] = [
    { date: 'Jan', responses: 1450, posts: 52 },
    { date: 'Feb', responses: 1570, posts: 60 },
    { date: 'Mar', responses: 1800, posts: 68 },
    { date: 'Apr', responses: 1860, posts: 80 },
    { date: 'May', responses: 1920, posts: 88 },
    { date: 'Jun', responses: 2040, posts: 96 },
    monthlyPoint('Jul', baseSnapshots.quarter.activity.slice(0, 2)),
    monthlyPoint('Aug', baseSnapshots.quarter.activity.slice(2, 4)),
    monthlyPoint('Sep', baseSnapshots.month.activity),
    { date: 'Oct', responses: 2180, posts: 112 },
    { date: 'Nov', responses: 2640, posts: 134 },
    { date: 'Dec', responses: 1980, posts: 104 },
];

const snapshots = {
    ...baseSnapshots,
    semester: {
        activity: annualActivity.slice(6),
        previousResponses: activityTotal(
            annualActivity.slice(0, 6),
            'responses',
        ),
        previousPosts: activityTotal(annualActivity.slice(0, 6), 'posts'),
        clusters: [
            { name: 'South Cotabato', participating: 14, total: 14 },
            { name: 'Cotabato', participating: 12, total: 12 },
            { name: 'Sultan Kudarat', participating: 10, total: 11 },
            { name: 'Sarangani', participating: 9, total: 9 },
        ],
        likes: 2512,
        comments: 816,
        shares: 244,
        contributors: 41,
    },
    annual: {
        activity: annualActivity,
        previousResponses: 20800,
        previousPosts: 904,
        clusters: [
            { name: 'South Cotabato', participating: 14, total: 14 },
            { name: 'Cotabato', participating: 12, total: 12 },
            { name: 'Sultan Kudarat', participating: 11, total: 11 },
            { name: 'Sarangani', participating: 9, total: 9 },
        ],
        likes: 4020,
        comments: 1320,
        shares: 398,
        contributors: 44,
    },
};

const lawSurveys = [
    { code: 'RA 7877', title: 'Anti-Sexual Harassment Act', share: 0.32 },
    {
        code: 'RA 9262',
        title: 'Anti-Violence Against Women and Their Children Act',
        share: 0.27,
    },
    { code: 'RA 9710', title: 'Magna Carta of Women', share: 0.23 },
    { code: 'RA 11313', title: 'Safe Spaces Act', share: 0.18 },
];

export const previewEvents = [
    {
        day: '08',
        month: 'Mar',
        date: '2026-03-08',
        title: 'Women’s Month campus forum',
        detail: 'Campaign · HEI network',
        color: 'bg-signature-red',
    },
    {
        day: '19',
        month: 'Jun',
        date: '2026-06-19',
        title: 'Building safer campus spaces',
        detail: 'Training · Regional workshop',
        color: 'bg-brand',
    },
    {
        day: '28',
        month: 'Sep',
        date: '2026-09-28',
        title: 'GAD focal persons’ roundtable',
        detail: 'Meeting · Online',
        color: 'bg-foreground',
    },
    {
        day: '25',
        month: 'Nov',
        date: '2026-11-25',
        title: 'Campus advocacy planning',
        detail: 'Campaign · HEI network',
        color: 'bg-signature-red',
    },
];

function selectedSnapshot(period: DashboardPeriod, monthIndex: number) {
    const { start, end } = reportingPeriod(period, monthIndex);
    const defaultStart = reportingPeriod(period).start;
    if (start === defaultStart) return snapshots[period];

    const months = annualActivity.slice(start, end + 1);
    const responses = activityTotal(months, 'responses');
    const reference = snapshots[period];
    const ratio = responses / activityTotal(reference.activity, 'responses');
    // Additional preview periods use the same monthly totals, split into
    // smaller display buckets; these are illustrative, never live analytics.
    const activity =
        period === 'semester'
            ? months
            : months.flatMap((month, index) => {
                  const count = period === 'month' ? 6 : 2;
                  const days = new Date(
                      Date.UTC(2026, start + index + 1, 0),
                  ).getUTCDate();
                  const step = period === 'month' ? 5 : 15;
                  return Array.from({ length: count }, (_, bucket) => ({
                      date: `${month.date} ${bucket * step + 1}–${bucket === count - 1 ? days : (bucket + 1) * step}`,
                      responses:
                          Math.floor((month.responses * (bucket + 1)) / count) -
                          Math.floor((month.responses * bucket) / count),
                      posts:
                          Math.floor((month.posts * (bucket + 1)) / count) -
                          Math.floor((month.posts * bucket) / count),
                  }));
              });
    const previous =
        start > 0 ? annualActivity.slice(start - months.length, start) : [];
    return {
        ...reference,
        activity,
        previousResponses: activityTotal(previous, 'responses'),
        previousPosts: activityTotal(previous, 'posts'),
        likes: Math.round(reference.likes * ratio),
        comments: Math.round(reference.comments * ratio),
        shares: Math.round(reference.shares * ratio),
    };
}

function growth(current: number, previous: number) {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
}

export function dashboardSnapshot(period: DashboardPeriod, monthIndex = 8) {
    const snapshot = selectedSnapshot(period, monthIndex);
    const responses = snapshot.activity.reduce(
        (sum, row) => sum + row.responses,
        0,
    );
    const posts = snapshot.activity.reduce((sum, row) => sum + row.posts, 0);
    const participating = snapshot.clusters.reduce(
        (sum, row) => sum + row.participating,
        0,
    );
    const institutions = snapshot.clusters.reduce(
        (sum, row) => sum + row.total,
        0,
    );
    const students = Math.round(responses * 0.68);
    const employees = Math.round(responses * 0.24);
    let allocated = 0;
    const surveys = lawSurveys.map((survey, index) => {
        const count =
            index === lawSurveys.length - 1
                ? responses - allocated
                : Math.round(responses * survey.share);
        allocated += count;
        return { ...survey, count };
    });
    return {
        ...snapshot,
        responses,
        posts,
        participating,
        institutions,
        reach: Math.round((participating / institutions) * 100),
        interactions: snapshot.likes + snapshot.comments + snapshot.shares,
        responseGrowth: growth(responses, snapshot.previousResponses),
        postGrowth: growth(posts, snapshot.previousPosts),
        surveys,
        respondents: [
            { name: 'Students', value: students, fill: 'var(--chart-2)' },
            { name: 'Employees', value: employees, fill: 'var(--chart-1)' },
            {
                name: 'Alumni',
                value: responses - students - employees,
                fill: 'var(--chart-3)',
            },
        ],
    };
}
export type DashboardSnapshot = ReturnType<typeof dashboardSnapshot>;
export const formatCount = (value: number) => value.toLocaleString('en-PH');
