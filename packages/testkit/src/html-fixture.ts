export function createHtmlFixture(html: string) {
  return new DOMParser().parseFromString(html, 'text/html');
}
