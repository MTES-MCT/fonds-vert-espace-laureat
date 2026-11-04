import { format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type TimelineStep = {
  label: string;
  date: string | null;
};

type TimelineProps = {
  steps: TimelineStep[];
};

function parseDate(dateStr: string): Date | null {
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Date non renseignée";

  const date = parseDate(dateStr);
  if (!date) return "Date non renseignée";
  return format(date, "d MMMM yyyy", { locale: fr });
}

function isDatePastOrToday(dateStr: string, today: Date): boolean {
  const date = parseDate(dateStr);
  if (!date) return false;
  return date <= today;
}

function isStepDone(
  steps: TimelineStep[],
  index: number,
  today: Date,
): boolean {
  const step = steps[index];
  if (step.date) {
    return isDatePastOrToday(step.date, today);
  }
  for (let i = index + 1; i < steps.length; i++) {
    const laterDate = steps[i].date;
    if (laterDate && isDatePastOrToday(laterDate, today)) {
      return true;
    }
  }
  return false;
}

const lineClassName = "absolute left-[calc(0.75rem-1px)] w-0.5";

function lineColor(isActive: boolean) {
  return isActive
    ? "bg-[var(--border-active-blue-france)]"
    : "bg-[var(--border-default-grey)]";
}

function TimelineMarker({ state }: { state: "done" | "next" | "upcoming" }) {
  if (state === "done") {
    return (
      <span
        className={`
          relative z-10 flex size-6 items-center justify-center rounded-full
          bg-[var(--background-action-high-blue-france)] text-white
        `}
      >
        <span className="fr-icon-check-line fr-icon--sm" />
      </span>
    );
  }
  return (
    <span
      className={`
        relative z-10 flex size-6 items-center justify-center rounded-full border-2 bg-white
        ${
          state === "next"
            ? "border-[var(--border-active-blue-france)]"
            : "border-[var(--border-default-grey)]"
        }
      `}
    >
      <span
        className={`
          rounded-full
          ${
            state === "next"
              ? "size-2 bg-[var(--background-action-high-blue-france)]"
              : "size-1.5 bg-[var(--border-default-grey)]"
          }
        `}
      />
    </span>
  );
}

export function Timeline({ steps }: TimelineProps) {
  const today = new Date();
  const headingId = "timeline-heading";
  const doneSteps = steps.map((_, index) => isStepDone(steps, index, today));
  const nextIndex = doneSteps.indexOf(false);

  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="fr-h6 mb-4">
        Calendrier
      </h3>
      <ol role="list" className="m-0 list-none p-0">
        {steps.map((step, index) => {
          const isDone = doneSteps[index];
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const hasDate = step.date !== null && parseDate(step.date) !== null;

          return (
            <li
              key={step.label}
              className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-4 p-0 pb-6 last:pb-0"
            >
              <span aria-hidden="true">
                {!isFirst && (
                  <span
                    className={`${lineClassName} top-0 h-3 ${lineColor(isDone)}`}
                  />
                )}
                {!isLast && (
                  <span
                    className={`${lineClassName} top-3 bottom-0 ${lineColor(doneSteps[index + 1])}`}
                  />
                )}
                <TimelineMarker
                  state={
                    isDone ? "done" : index === nextIndex ? "next" : "upcoming"
                  }
                />
              </span>
              <div>
                <p className="mb-0 font-bold">
                  {step.label}
                  <span className="sr-only">
                    {isDone ? " - terminé" : " - à venir"}
                  </span>
                </p>
                <time
                  dateTime={hasDate ? (step.date ?? undefined) : undefined}
                  className={`
                    text-sm text-[var(--text-mention-grey)]
                    ${hasDate ? "" : "italic"}
                  `}
                >
                  {formatDate(step.date)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
