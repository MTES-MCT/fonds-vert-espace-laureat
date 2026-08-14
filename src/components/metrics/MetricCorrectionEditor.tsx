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
import {
  type MetricValueValidation,
  normalizeMetricValue,
} from "@/utils/metrics/values";

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

function scalarInputCandidate(
  valueType: Exclude<DossierMetricRevisionTarget["valueType"], "text_array">,
  rawValue: string,
): unknown {
  switch (valueType) {
    case "number": {
      const normalizedValue = rawValue
        .replace(/[\s\u00a0\u202f]/g, "")
        .replace(",", ".");
      return normalizedValue.length > 0 ? Number(normalizedValue) : undefined;
    }
    case "text":
      return rawValue;
    case "boolean":
      if (rawValue === "true") return true;
      if (rawValue === "false") return false;
      return undefined;
  }
}

function validationMessage(
  valueType: DossierMetricRevisionTarget["valueType"],
  validation: Extract<MetricValueValidation, { success: false }>,
): string {
  switch (valueType) {
    case "number":
      return "Saisissez un nombre valide.";
    case "text":
      return "Saisissez une valeur non vide.";
    case "boolean":
      return "Sélectionnez oui ou non.";
    case "text_array":
      return validation.reason === "duplicate-value"
        ? "Chaque valeur doit être unique."
        : "Renseignez chaque valeur ou supprimez les champs vides.";
  }
}

function textArrayInputValue(value: MetricValue): string[] {
  return Array.isArray(value) && value.length > 0 ? [...value] : [""];
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
  const [textArrayValues, setTextArrayValues] = useState(() =>
    textArrayInputValue(target.effectiveValue),
  );
  const [error, setError] = useState<string>();
  const [invalidTextArrayIndex, setInvalidTextArrayIndex] = useState<number>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const textArrayInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const setInputRef = (
    element: HTMLInputElement | HTMLTextAreaElement | null,
  ) => {
    inputRef.current = element;
  };

  const focusCorrectionControl = (textArrayIndex = 0) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (target.valueType === "text_array") {
          textArrayInputRefs.current[textArrayIndex]?.focus();
          return;
        }

        inputRef.current?.focus();
      });
    });
  };

  const openEditor = () => {
    setRawValue(inputValue(target.effectiveValue));
    setTextArrayValues(textArrayInputValue(target.effectiveValue));
    setError(undefined);
    setInvalidTextArrayIndex(undefined);
    setSuccessMessage(undefined);
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

    let value: MetricValue | undefined;

    if (target.valueType === "text_array") {
      const validation = normalizeMetricValue(
        target.valueType,
        textArrayValues,
      );
      if (!validation.success) {
        setError(validationMessage(target.valueType, validation));
        setInvalidTextArrayIndex(validation.invalidIndex);
        focusCorrectionControl(validation.invalidIndex ?? 0);
        return;
      }
      value = validation.value;
    } else {
      const validation = normalizeMetricValue(
        target.valueType,
        scalarInputCandidate(target.valueType, rawValue),
      );
      if (!validation.success) {
        setError(validationMessage(target.valueType, validation));
        focusCorrectionControl();
        return;
      }
      value = validation.value;
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
  const unitHint = target.unit ? `Unité : ${target.unit}` : undefined;
  const correctionField = () => {
    switch (target.valueType) {
      case "boolean":
        return (
          <RadioButtons
            legend={target.label}
            hintText={unitHint}
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
      case "text_array": {
        const updateValue = (index: number, value: string) => {
          setTextArrayValues((currentValues) =>
            currentValues.map((currentValue, currentIndex) =>
              currentIndex === index ? value : currentValue,
            ),
          );
          setError(undefined);
          setInvalidTextArrayIndex(undefined);
        };
        const addValue = () => {
          const newIndex = textArrayValues.length;
          setTextArrayValues((currentValues) => [...currentValues, ""]);
          focusCorrectionControl(newIndex);
        };
        const removeValue = (index: number) => {
          if (textArrayValues.length === 1) return;
          setTextArrayValues((currentValues) =>
            currentValues.filter((_, currentIndex) => currentIndex !== index),
          );
          setError(undefined);
          setInvalidTextArrayIndex(undefined);
          focusCorrectionControl(Math.max(0, index - 1));
        };

        return (
          <fieldset className="m-0 border-0 p-0">
            <legend className="sr-only">Valeurs à modifier</legend>
            <div className="space-y-4">
              {textArrayValues.map((value, index) => (
                <div
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                  key={index}
                >
                  <Input
                    label={`Valeur ${index + 1}`}
                    state={
                      invalidTextArrayIndex === index ? "error" : "default"
                    }
                    stateRelatedMessage={
                      invalidTextArrayIndex === index ? error : undefined
                    }
                    nativeInputProps={{
                      autoComplete: "off",
                      disabled: isSubmitting,
                      id: `${instanceId}-value-${index}`,
                      name: `metric-value-${index + 1}`,
                      onChange: (event) =>
                        updateValue(index, event.target.value),
                      ref: (element) => {
                        textArrayInputRefs.current[index] = element;
                      },
                      value,
                    }}
                  />
                  <Button
                    className="sm:mt-9 sm:self-start"
                    priority="tertiary"
                    size="small"
                    iconId="fr-icon-delete-line"
                    disabled={isSubmitting || textArrayValues.length === 1}
                    nativeButtonProps={{
                      "aria-label": `Supprimer la valeur ${index + 1}`,
                      onClick: () => removeValue(index),
                      type: "button",
                    }}
                  >
                    Supprimer
                  </Button>
                </div>
              ))}
            </div>
            {error && invalidTextArrayIndex === undefined && (
              <p className="fr-error-text mt-2" role="alert">
                {error}
              </p>
            )}
            <Button
              className="mt-4"
              priority="secondary"
              size="small"
              iconId="fr-icon-add-line"
              disabled={isSubmitting}
              nativeButtonProps={{ onClick: addValue, type: "button" }}
            >
              Ajouter une valeur
            </Button>
          </fieldset>
        );
      }
      case "number":
      case "text":
        return (
          <Input
            label={target.label}
            hintText={unitHint}
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
        className="bg-white"
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

      <modal.Component
        title="Modifier la valeur"
        size={target.valueType === "text_array" ? "large" : "medium"}
      >
        <form className="space-y-6" onSubmit={submit}>
          {target.valueType === "text_array" && (
            <div>
              <p className="font-medium">{target.label}</p>
              {unitHint && <p className="fr-hint-text">{unitHint}</p>}
            </div>
          )}

          <div className="space-y-2">{correctionField()}</div>

          <ButtonsGroup
            alignment="right"
            inlineLayoutWhen="sm and up"
            isReverseOrder
            buttons={[
              {
                children: isSubmitting ? "Enregistrement…" : "Enregistrer",
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
