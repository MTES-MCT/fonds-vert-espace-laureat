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

export function Timeline({ steps }: TimelineProps) {
  const today = new Date();
  const headingId = "timeline-heading";

  return (
    <section
      aria-labelledby={headingId}
      className="mb-6 border-b border-[var(--border-default-grey)] pb-3"
    >
      <h3
        id={headingId}
        className="mb-3 text-left text-base font-medium text-[var(--text-label-grey)]"
      >
        Calendrier
      </h3>
      <ul role="list" className="list-none space-y-0 pl-0">
        {steps.map((step, index) => {
          const isDone = isStepDone(steps, index, today);
          const isLast = index === steps.length - 1;
          const isNextDone = !isLast && isStepDone(steps, index + 1, today);

          return (
            <li key={step.label} className="grid grid-cols-[1rem_1fr] gap-3">
              <div className="relative flex h-full items-start justify-center pt-0.5">
                {!isLast && (
                  <div
                    className={`absolute top-[7px] left-1/2 -ml-px h-full w-0.5 ${
                      isNextDone
                        ? "bg-[var(--background-action-high-blue-france)]"
                        : "bg-[var(--border-default-grey)]"
                    }`}
                  />
                )}
                <div
                  className={`
                    relative z-10 flex size-2.5 items-center justify-center rounded-full bg-white
                  `}
                >
                  {isDone ? (
                    <div
                      className={`
                        size-2.5 rounded-full bg-[var(--background-action-high-blue-france)]
                      `}
                    />
                  ) : (
                    <div
                      className={`
                        size-2.5 rounded-full border-2 border-[var(--border-default-grey)] bg-white
                      `}
                    />
                  )}
                </div>
              </div>
              <div
                className={`flex flex-col gap-0 ${isLast ? "pb-0" : "pb-4"}`}
              >
                <p className="m-0 text-xs leading-tight font-medium text-[var(--text-default-grey)]">
                  {step.label}
                  <span className="sr-only">
                    {isDone ? " - terminé" : " - à venir"}
                  </span>
                </p>
                <time className="text-xs leading-tight text-[var(--text-mention-grey)]">
                  {formatDate(step.date)}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
