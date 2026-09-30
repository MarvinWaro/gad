export const myProfileHref = '/settings/profile?view=my-profile';

export function isMyProfileView(url: string): boolean {
    const [path, query] = url.split('?');

    return (
        path === '/settings/profile' &&
        new URLSearchParams(query?.split('#')[0]).get('view') === 'my-profile'
    );
}
