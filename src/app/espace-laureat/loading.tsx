export default async function Loading() {
  return (
    <>
      <h1 className="w-96 h-12 bg-white animate-pulse"></h1>
      <div className="flex flex-col gap-y-8">
        <div className="p-6 w-full h-[419px] bg-white animate-pulse">
          <h2 className="w-80 h-10 bg-gray-200 animate-pulse"></h2>
        </div>
      </div>
    </>
  );
}
