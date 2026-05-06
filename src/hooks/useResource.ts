import { useCallback, useEffect, useState } from "react";

export function useResource<T>(loader: () => Promise<T>, initial: T) {
  const [items, setItems] = useState<T>(initial);

  const reload = useCallback(async () => {
    const data = await loader();
    setItems(data);
  }, [loader]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, reload, setItems };
}
