export function TabButton({
  selected,
  annee,
  count,
}: {
  selected: boolean;
  annee: number;
  count: number;
}) {
  return (
    <li role="presentation">
      <button
        id={`tabpanel-${annee}`}
        className="fr-tabs__tab fr-icon-trophy-line fr-tabs__tab--icon-left"
        tabIndex={selected ? 0 : -1}
        role="tab"
        aria-selected={selected ? true : false}
        aria-controls={`tabpanel-${annee}-panel`}
      >
        Lauréats {annee} ({count})
      </button>
    </li>
  );
}
