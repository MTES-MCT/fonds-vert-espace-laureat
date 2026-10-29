export function metricEditorId(metricCode: string): string {
  return `metric-editor-${encodeURIComponent(metricCode)}`;
}
