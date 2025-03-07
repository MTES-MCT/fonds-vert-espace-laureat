export function ProgressBar({
  value,
  max,
  formattedMin,
  formattedMax,
}: {
  value: number;
  max: number;
  formattedMin: string;
  formattedMax: string;
}) {
  return (
    <div className="mb-3 max-w-xs">
      <div className="rounded-full border border-blue-france-sun-113 overflow-hidden w-full h-3">
        <div
          className="bg-white h-full"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <div>{formattedMin}</div>
        <div>{formattedMax}</div>
      </div>
    </div>
  );
}
