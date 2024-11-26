export function ProgressBar({
  value,
  max,
  formattedMax,
  formattedValue,
}: {
  value: number;
  max: number;
  formattedValue: string;
  formattedMax: string;
}) {
  return (
    <div>
      <div className="rounded-full bg-white overflow-hidden w-full h-3 bg-blue-100">
        <div
          className="bg-blue-500 h-full"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <div className="flex justify-between">
        <div>{formattedValue}</div>
        <div>{formattedMax}</div>
      </div>
    </div>
  );
}
