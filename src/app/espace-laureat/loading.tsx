export default async function Loading() {
  return (
    <div className="fr-container my-8">
      <h1 className="h-12 w-96 animate-pulse bg-white"></h1>
      <div className="flex flex-col gap-y-8">
        <div className="h-[419px] w-full animate-pulse bg-white p-6">
          <h2 className="h-10 w-80 animate-pulse bg-gray-200"></h2>
        </div>
      </div>
    </div>
  );
}
