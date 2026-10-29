"use client";

import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import Select from "@codegouvfr/react-dsfr/Select";
import {
  type FormEvent,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { successToast } from "@/components/toast/toast";
import type { DossierProgressTarget } from "@/db/dossierProgress";
import {
  DOSSIER_PROGRESS_STATUSES,
  type DossierProgressStatus,
  isDossierProgressStatus,
  requiresProgressConfirmation,
} from "@/utils/dossierProgress";

const severityByStatus = {
  "Non-commencé": "new",
  "En cours de réalisation": "info",
  Bloqué: "warning",
  Abandonné: "error",
  Terminé: "success",
} as const;
const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});
const subscribeToHydration = () => () => {};

export function StatutRealisation({
  dossierNumber,
  initialTarget,
  correctionApiPath,
}: {
  dossierNumber: number;
  initialTarget: DossierProgressTarget;
  correctionApiPath?: string;
}) {
  const instanceId = useId().replaceAll(":", "");
  const modal = useMemo(
    () =>
      createModal({
        id: `dossier-progress-${instanceId}`,
        isOpenedByDefault: false,
      }),
    [instanceId],
  );
  const [savedTarget, setSavedTarget] = useState<{
    target: DossierProgressTarget;
    initialTarget: DossierProgressTarget;
  }>();
  // A demo reset restarts revisions; the response replaces its original snapshot.
  const target =
    savedTarget &&
    ((savedTarget.initialTarget.revision === initialTarget.revision &&
      savedTarget.initialTarget.status === initialTarget.status &&
      savedTarget.initialTarget.updatedAt === initialTarget.updatedAt) ||
      (savedTarget.target.updatedAt !== null &&
        initialTarget.updatedAt !== null &&
        (savedTarget.target.updatedAt > initialTarget.updatedAt ||
          (savedTarget.target.updatedAt === initialTarget.updatedAt &&
            savedTarget.target.revision >= initialTarget.revision))))
      ? savedTarget.target
      : initialTarget;
  const [openedTarget, setOpenedTarget] = useState(target);
  const [selectedStatus, setSelectedStatus] = useState<
    DossierProgressStatus | ""
  >(target.status ?? "");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const submittingRef = useRef(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const confirmationRef = useRef<HTMLParagraphElement>(null);
  const isReady = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  useIsModalOpen(modal, {
    onConceal: () => openerRef.current?.focus(),
    onDisclose: () => focusSelect(),
  });

  const focusSelect = () =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => selectRef.current?.focus()),
    );
  const openEditor = () => {
    setOpenedTarget(target);
    setSelectedStatus(target.status ?? "");
    setIsConfirming(false);
    setError(undefined);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!isDossierProgressStatus(selectedStatus)) {
      setError("Sélectionnez un avancement.");
      focusSelect();
      return;
    }
    if (
      selectedStatus !== openedTarget.status &&
      requiresProgressConfirmation(selectedStatus) &&
      !isConfirming
    ) {
      setIsConfirming(true);
      requestAnimationFrame(() => confirmationRef.current?.focus());
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError(undefined);
    try {
      const response = await fetch(
        correctionApiPath ?? `/api/projets/${dossierNumber}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: selectedStatus,
            expectedRevision: openedTarget.revision,
            confirmed: isConfirming,
          }),
        },
      );
      const body = (await response.json().catch(() => ({}))) as {
        target?: DossierProgressTarget;
        error?: string;
      };
      if (response.status === 409 && body.target) {
        const currentTarget = body.target;
        setSavedTarget({ target: currentTarget, initialTarget });
        setOpenedTarget(currentTarget);
        setSelectedStatus(currentTarget.status ?? "");
        setIsConfirming(false);
        setError(
          body.error ??
            "L’avancement a été modifié. L’avancement actuel a été chargé.",
        );
        focusSelect();
        return;
      }
      if (!response.ok || !body.target)
        throw new Error(
          body.error ?? "L’avancement n’a pas pu être enregistré.",
        );
      setSavedTarget({ target: body.target, initialTarget });
      if (body.target.revision !== openedTarget.revision)
        successToast("Avancement enregistré.");
      modal.close();
    } catch (caughtError) {
      setIsConfirming(false);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "L’avancement n’a pas pu être enregistré.",
      );
      focusSelect();
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="status-heading" className="space-y-3 text-left">
      <h3
        id="status-heading"
        className="text-left text-base font-medium text-[var(--text-label-grey)]"
      >
        Avancement du projet
      </h3>
      <div className="space-y-2">
        {target.status ? (
          <Badge
            small
            noIcon
            className="whitespace-nowrap"
            severity={severityByStatus[target.status]}
          >
            {target.status}
          </Badge>
        ) : (
          <p className="mb-0">Non renseigné</p>
        )}
        {target.updatedAt && (
          <p className="fr-text--xs text-[var(--text-mention-grey)]">
            Dernière modification :{" "}
            {dateFormatter.format(new Date(target.updatedAt))}
          </p>
        )}
        <Button
          ref={openerRef}
          disabled={!isReady}
          priority="secondary"
          size="small"
          nativeButtonProps={{
            ...modal.buttonProps,
            type: "button",
            onClick: openEditor,
          }}
        >
          Modifier l’avancement
        </Button>
      </div>
      <modal.Component
        title={
          isConfirming ? "Confirmer l’avancement" : "Modifier l’avancement"
        }
        size="medium"
      >
        <form className="space-y-6" onSubmit={submit}>
          {isConfirming ? (
            <p ref={confirmationRef} tabIndex={-1}>
              Passer l’avancement à « {selectedStatus} » ?
            </p>
          ) : (
            <Select
              label="Avancement du projet"
              disabled={isSubmitting}
              state={error ? "error" : "default"}
              stateRelatedMessage={
                error ? <span role="alert">{error}</span> : undefined
              }
              nativeSelectProps={{
                value: selectedStatus,
                ref: selectRef,
                onChange: (event) => {
                  const value = event.target.value;
                  setSelectedStatus(
                    isDossierProgressStatus(value) ? value : "",
                  );
                  setError(undefined);
                },
              }}
            >
              <option value="" disabled>
                Sélectionner un avancement
              </option>
              {DOSSIER_PROGRESS_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          )}
          <ButtonsGroup
            alignment="right"
            inlineLayoutWhen="sm and up"
            isReverseOrder
            buttons={[
              {
                children: isSubmitting
                  ? "Enregistrement…"
                  : isConfirming
                    ? "Confirmer"
                    : "Enregistrer",
                type: "submit",
                disabled: isSubmitting,
              },
              {
                children: "Annuler",
                type: "button",
                priority: "secondary",
                disabled: isSubmitting,
                onClick: () => modal.close(),
              },
            ]}
          />
        </form>
      </modal.Component>
    </section>
  );
}
