"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { type FormEvent, useId, useMemo, useRef, useState } from "react";

import type { DossierMetricRevisionTarget } from "@/db/dossierMetrics";
import type { MetricValue } from "@/services/fondsvert/dossier";

import { useMetricRevisions } from "./MetricRevisionContext";

function inputValue(value: MetricValue): string {
  if (Array.isArray(value)) {
    return value.join("\n");
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function sourceValue(value: MetricValue): string {
  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }

  return inputValue(value);
}

function parseValue(
  valueType: DossierMetricRevisionTarget["valueType"],
  rawValue: string,
): MetricValue | undefined {
  switch (valueType) {
    case "number": {
      const normalizedValue = rawValue
        .replace(/[\s\u00a0\u202f]/g, "")
        .replace(",", ".");
      const value = Number(normalizedValue);
      return normalizedValue.length > 0 && Number.isFinite(value)
        ? value
        : undefined;
    }
    case "text": {
      const value = rawValue.trim();
      return value.length > 0 ? value : undefined;
    }
    case "boolean":
      if (rawValue === "true") return true;
      if (rawValue === "false") return false;
      return undefined;
    case "text_array": {
      const values = rawValue.split("\n").map((value) => value.trim());
      return values.length > 0 && values.every((value) => value.length > 0)
        ? values
        : undefined;
    }
  }
}

function validationMessage(
  valueType: DossierMetricRevisionTarget["valueType"],
): string {
  switch (valueType) {
    case "number":
      return "Saisissez un nombre valide.";
    case "text":
      return "Saisissez une valeur non vide.";
    case "boolean":
      return "Sélectionnez oui ou non.";
    case "text_array":
      return "Saisissez au moins une valeur, une par ligne.";
  }
}

export function MetricCorrectionEditor({
  target,
  buttonLabel = "Modifier la valeur",
  successFeedback = "editor",
  onSuccess,
}: {
  target: DossierMetricRevisionTarget;
  buttonLabel?: string;
  successFeedback?: "editor" | "parent";
  onSuccess?: (target: DossierMetricRevisionTarget) => void;
}) {
  const instanceId = useId().replaceAll(":", "");
  const modal = useMemo(
    () =>
      createModal({
        id: `metric-correction-${target.metricCode}-${instanceId}`,
        isOpenedByDefault: false,
      }),
    [instanceId, target.metricCode],
  );
  const { correctMetric } = useMetricRevisions();
  const [rawValue, setRawValue] = useState(inputValue(target.effectiveValue));
  const [error, setError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const setInputRef = (
    element: HTMLInputElement | HTMLTextAreaElement | null,
  ) => {
    inputRef.current = element;
  };

  const focusCorrectionControl = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  };

  const openEditor = () => {
    setRawValue(inputValue(target.effectiveValue));
    setError(undefined);
    setSuccessMessage(undefined);
    modal.open();
    focusCorrectionControl();
  };

  const closeEditor = () => {
    modal.close();
    requestAnimationFrame(() => openerRef.current?.focus());
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const value = parseValue(target.valueType, rawValue);
    if (value === undefined) {
      setError(validationMessage(target.valueType));
      focusCorrectionControl();
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError(undefined);

    try {
      const updatedTarget = await correctMetric(target.metricCode, value);
      if (successFeedback === "editor") {
        setSuccessMessage(`Correction enregistrée pour « ${target.label} ».`);
      }
      onSuccess?.(updatedTarget);
      closeEditor();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "La correction n’a pas pu être enregistrée.",
      );
      focusCorrectionControl();
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const fieldState = error ? "error" : "default";
  const correctionField = () => {
    switch (target.valueType) {
      case "boolean":
        return (
          <RadioButtons
            legend="Valeur corrigée"
            orientation="horizontal"
            state={fieldState}
            stateRelatedMessage={error}
            options={[
              {
                label: "Oui",
                nativeInputProps: {
                  checked: rawValue === "true",
                  disabled: isSubmitting,
                  onChange: () => setRawValue("true"),
                  ref: setInputRef,
                },
              },
              {
                label: "Non",
                nativeInputProps: {
                  checked: rawValue === "false",
                  disabled: isSubmitting,
                  onChange: () => setRawValue("false"),
                },
              },
            ]}
          />
        );
      case "text_array":
        return (
          <Input
            label="Valeur corrigée"
            textArea
            state={fieldState}
            stateRelatedMessage={error}
            nativeTextAreaProps={{
              value: rawValue,
              disabled: isSubmitting,
              onChange: (event) => setRawValue(event.target.value),
              ref: setInputRef,
            }}
          />
        );
      case "number":
      case "text":
        return (
          <Input
            label="Valeur corrigée"
            state={fieldState}
            stateRelatedMessage={error}
            nativeInputProps={{
              value: rawValue,
              disabled: isSubmitting,
              inputMode: target.valueType === "number" ? "decimal" : undefined,
              onChange: (event) => setRawValue(event.target.value),
              ref: setInputRef,
            }}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Button
        ref={openerRef}
        priority="tertiary"
        size="small"
        nativeButtonProps={{
          ...modal.buttonProps,
          type: "button",
          onClick: openEditor,
        }}
      >
        {buttonLabel}
      </Button>

      <modal.Component title="Modifier la valeur" size="small">
        <form className="space-y-6" onSubmit={submit}>
          <p className="font-medium">{target.label}</p>

          <div className="space-y-2">
            {target.valueType === "text_array" ? (
              <Input
                label="Valeur source"
                textArea
                nativeTextAreaProps={{
                  value: sourceValue(target.sourceValue),
                  readOnly: true,
                }}
              />
            ) : (
              <Input
                label="Valeur source"
                nativeInputProps={{
                  value: sourceValue(target.sourceValue),
                  readOnly: true,
                }}
              />
            )}

            {correctionField()}

            {target.unit && (
              <p className="fr-hint-text">Unité : {target.unit}</p>
            )}
          </div>

          <ButtonsGroup
            alignment="right"
            inlineLayoutWhen="sm and up"
            isReverseOrder
            buttons={[
              {
                children: isSubmitting
                  ? "Enregistrement…"
                  : "Enregistrer la correction",
                disabled: isSubmitting,
                type: "submit",
              },
              {
                children: "Annuler",
                disabled: isSubmitting,
                onClick: closeEditor,
                priority: "secondary",
                type: "button",
              },
            ]}
          />
        </form>
      </modal.Component>

      {successMessage && (
        <Alert
          severity="success"
          small
          description={successMessage}
          role="status"
        />
      )}
    </div>
  );
}
