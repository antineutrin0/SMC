import { Minus, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

/**
 * NumericInput
 *
 * A reusable bounded numeric input with +/− stepper buttons.
 *
 * Props:
 *   value      {number|string}  - controlled value
 *   onChange   {(val: number) => void} - called with the clamped number
 *   min        {number}         - minimum allowed value (default: 0)
 *   max        {number}         - maximum allowed value (default: Infinity)
 *   step       {number}         - increment/decrement step (default: 1)
 *   placeholder {string}
 *   disabled   {boolean}
 */
export function NumericInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  placeholder = "0",
  disabled = false,
}) {
  // Clamp a raw number between min and max
  const clamp = (num) => Math.min(Math.max(num, min), max);

  const handleDecrement = () => {
    const next = clamp(Number(value || 0) - step);
    onChange(next);
  };

  const handleIncrement = () => {
    const next = clamp(Number(value || 0) + step);
    onChange(next);
  };

  // On manual typing: allow empty string while typing, clamp on valid numbers
  const handleChange = (e) => {
    const raw = e.target.value;

    // Allow clearing the field while the user is typing
    if (raw === "" || raw === "-") {
      onChange("");
      return;
    }

    const parsed = Number(raw);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    }
  };

  // On blur: if empty or below min, snap to min
  const handleBlur = () => {
    if (value === "" || value === undefined || value === null) {
      onChange(min);
      return;
    }
    const parsed = Number(value);
    if (isNaN(parsed) || parsed < min) {
      onChange(min);
    }
  };

  const atMin = Number(value) <= min || value === "";
  const atMax = Number(value) >= max;

  return (
    <div className="flex items-center rounded-md border overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
      {/* Decrement button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-8 shrink-0 rounded-none border-r text-muted-foreground hover:text-foreground disabled:opacity-40"
        onClick={handleDecrement}
        disabled={disabled || atMin}
        tabIndex={-1}
        aria-label="Decrease"
      >
        <Minus className="size-3" />
      </Button>

      {/* Text input */}
      <Input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max === Infinity ? undefined : max}
        className="h-9 rounded-none border-0 text-center shadow-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      {/* Increment button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-8 shrink-0 rounded-none border-l text-muted-foreground hover:text-foreground disabled:opacity-40"
        onClick={handleIncrement}
        disabled={disabled || atMax}
        tabIndex={-1}
        aria-label="Increase"
      >
        <Plus className="size-3" />
      </Button>
    </div>
  );
}
