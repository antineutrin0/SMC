import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

// ─── Generic async fetch hook ────────────────────────────────
export function useFetch(fetchFn, deps = [], options = {}) {
  const { onError, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

const execute = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await fetchFn();
    if (mountedRef.current) setData(result);
  } catch (err) {
    if (mountedRef.current) {
      setError(err.message);
      if (onError) onError(err);
      else toast.error(err.message || "Failed to load data");
    }
  } finally {
    if (mountedRef.current) setLoading(false);
  }
}, [fetchFn]);  

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => {
      mountedRef.current = false;
    };
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

export function useMutation(mutationFn, options = {}) {
  const { onSuccess, onError, successMessage } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(...args);
        if (successMessage) toast.success(successMessage);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        setError(err.message);
        if (onError) onError(err);
        else toast.error(err.message || "Operation failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, onSuccess, onError, successMessage],
  ); // eslint-disable-line

  return { mutate, loading, error };
}

// ─── Form state hook ─────────────────────────────────────────
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setValue(name, type === "checkbox" ? checked : value);
    },
    [setValue],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]); // eslint-disable-line

  const setFieldError = useCallback((name, msg) => {
    setErrors((prev) => ({ ...prev, [name]: msg }));
  }, []);

  return {
    values,
    errors,
    setValue,
    handleChange,
    reset,
    setFieldError,
    setValues,
  };
}

export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  return { isOpen, open, close, toggle, setIsOpen };
}
