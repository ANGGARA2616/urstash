"use client";

import * as React from "react";
import { substitutePromptVariables } from "@/lib/prompt-variables";
import { CopyButton } from "@/components/copy-button";
import { Input } from "@/components/ui/input";

/** Fill-in inputs for {{variable}} placeholders with a live preview + copy. */
export function PromptFill({
  promptText,
  variables,
}: {
  promptText: string;
  variables: string[];
}) {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const substituted = substitutePromptVariables(promptText, values);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {variables.map((name) => (
          <label key={name} className="flex flex-col gap-1">
            <span className="text-sm font-medium text-secondary">{name}</span>
            <Input
              value={values[name] ?? ""}
              placeholder={`{{${name}}}`}
              onChange={(e) =>
                setValues((v) => ({ ...v, [name]: e.target.value }))
              }
            />
          </label>
        ))}
      </div>
      <div className="flex justify-end">
        <CopyButton text={substituted} label="Copy prompt" />
      </div>
      <pre className="whitespace-pre-wrap rounded-panel bg-fill p-4 font-mono text-sm text-ink">
        {substituted}
      </pre>
    </div>
  );
}
