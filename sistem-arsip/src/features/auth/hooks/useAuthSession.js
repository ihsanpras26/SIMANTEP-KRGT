import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createAuthSession } from "../services/authSession";

export function useAuthSession(client, adminEmail) {
  const queryClient = useQueryClient();
  const [state, setState] = useState({
    status: "loading",
    session: null,
    error: null,
  });

  useEffect(() => {
    if (!client || !adminEmail) return;
    return createAuthSession({
      auth: client.auth,
      queryClient,
      adminEmail,
      onChange: setState,
    });
  }, [client, adminEmail, queryClient]);

  return state;
}
