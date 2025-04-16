export function NonDisponible() {
  return (
    <div
      className={`
        flex items-center gap-x-1 rounded-sm bg-white px-2 py-1 text-xs text-gray-700 shadow-xs
      `}
    >
      <span className="fr-icon-warning-fill fr-icon--xs flex items-center"></span>
      Non disponible
    </div>
  );
}
