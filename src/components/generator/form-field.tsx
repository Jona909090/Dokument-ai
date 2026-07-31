import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type FieldDefinition = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "date" | "number";
  multiline?: boolean;
  required?: boolean;
  wide?: boolean;
};

type FormFieldProps = FieldDefinition & {
  value: string;
  onChange: (value: string) => void;
};

export function FormField({ name, label, placeholder, type, multiline, required, wide, value, onChange }: FormFieldProps) {
  const id = `field-${name}`;
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-800">
        {label}{required && <span className="ml-1 text-blue-600">*</span>}
      </label>
      {multiline ? (
        <Textarea id={id} name={name} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="min-h-28" />
      ) : (
        <Input id={id} name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />
      )}
    </div>
  );
}
