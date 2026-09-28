/** The element the URL's #fragment names, if the page has one. */
export function hashTarget(): HTMLElement | null {
    const id = decodeURIComponent(window.location.hash.slice(1));
    return id ? document.getElementById(id) : null;
}
