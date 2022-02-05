export default function renderIf(condition: any, content: any): any {
  if (condition) {
    return content;
  }
  return null;
}
